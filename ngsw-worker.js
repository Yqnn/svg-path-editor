(function () {
    'use strict';

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Adapts the service worker to its runtime environment.
     *
     * Mostly, this is used to mock out identifiers which are otherwise read
     * from the global scope.
     */
    class Adapter {
        constructor(scopeUrl) {
            this.scopeUrl = scopeUrl;
            const parsedScopeUrl = this.parseUrl(this.scopeUrl);
            // Determine the origin from the registration scope. This is used to differentiate between
            // relative and absolute URLs.
            this.origin = parsedScopeUrl.origin;
            // Suffixing `ngsw` with the baseHref to avoid clash of cache names for SWs with different
            // scopes on the same domain.
            this.cacheNamePrefix = 'ngsw:' + parsedScopeUrl.path;
        }
        /**
         * Wrapper around the `Request` constructor.
         */
        newRequest(input, init) {
            return new Request(input, init);
        }
        /**
         * Wrapper around the `Response` constructor.
         */
        newResponse(body, init) {
            return new Response(body, init);
        }
        /**
         * Wrapper around the `Headers` constructor.
         */
        newHeaders(headers) {
            return new Headers(headers);
        }
        /**
         * Test if a given object is an instance of `Client`.
         */
        isClient(source) {
            return (source instanceof Client);
        }
        /**
         * Read the current UNIX time in milliseconds.
         */
        get time() {
            return Date.now();
        }
        /**
         * Get a normalized representation of a URL such as those found in the ServiceWorker's `ngsw.json`
         * configuration.
         *
         * More specifically:
         * 1. Resolve the URL relative to the ServiceWorker's scope.
         * 2. If the URL is relative to the ServiceWorker's own origin, then only return the path part.
         *    Otherwise, return the full URL.
         *
         * @param url The raw request URL.
         * @return A normalized representation of the URL.
         */
        normalizeUrl(url) {
            // Check the URL's origin against the ServiceWorker's.
            const parsed = this.parseUrl(url, this.scopeUrl);
            return (parsed.origin === this.origin ? parsed.path : url);
        }
        /**
         * Parse a URL into its different parts, such as `origin`, `path` and `search`.
         */
        parseUrl(url, relativeTo) {
            // Workaround a Safari bug, see
            // https://github.com/angular/angular/issues/31061#issuecomment-503637978
            const parsed = !relativeTo ? new URL(url) : new URL(url, relativeTo);
            return { origin: parsed.origin, path: parsed.pathname, search: parsed.search };
        }
        /**
         * Wait for a given amount of time before completing a Promise.
         */
        timeout(ms) {
            return new Promise(resolve => {
                setTimeout(() => resolve(), ms);
            });
        }
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * An error returned in rejected promises if the given key is not found in the table.
     */
    class NotFound {
        constructor(table, key) {
            this.table = table;
            this.key = key;
        }
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * An implementation of a `Database` that uses the `CacheStorage` API to serialize
     * state within mock `Response` objects.
     */
    class CacheDatabase {
        constructor(scope, adapter) {
            this.scope = scope;
            this.adapter = adapter;
            this.tables = new Map();
        }
        'delete'(name) {
            if (this.tables.has(name)) {
                this.tables.delete(name);
            }
            return this.scope.caches.delete(`${this.adapter.cacheNamePrefix}:db:${name}`);
        }
        list() {
            return this.scope.caches.keys().then(keys => keys.filter(key => key.startsWith(`${this.adapter.cacheNamePrefix}:db:`)));
        }
        open(name, cacheQueryOptions) {
            if (!this.tables.has(name)) {
                const table = this.scope.caches.open(`${this.adapter.cacheNamePrefix}:db:${name}`)
                    .then(cache => new CacheTable(name, cache, this.adapter, cacheQueryOptions));
                this.tables.set(name, table);
            }
            return this.tables.get(name);
        }
    }
    /**
     * A `Table` backed by a `Cache`.
     */
    class CacheTable {
        constructor(table, cache, adapter, cacheQueryOptions) {
            this.table = table;
            this.cache = cache;
            this.adapter = adapter;
            this.cacheQueryOptions = cacheQueryOptions;
        }
        request(key) {
            return this.adapter.newRequest('/' + key);
        }
        'delete'(key) {
            return this.cache.delete(this.request(key), this.cacheQueryOptions);
        }
        keys() {
            return this.cache.keys().then(requests => requests.map(req => req.url.substr(1)));
        }
        read(key) {
            return this.cache.match(this.request(key), this.cacheQueryOptions).then(res => {
                if (res === undefined) {
                    return Promise.reject(new NotFound(this.table, key));
                }
                return res.json();
            });
        }
        write(key, value) {
            return this.cache.put(this.request(key), this.adapter.newResponse(JSON.stringify(value)));
        }
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try {
                step(generator.next(value));
            }
            catch (e) {
                reject(e);
            } }
            function rejected(value) { try {
                step(generator["throw"](value));
            }
            catch (e) {
                reject(e);
            } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var UpdateCacheStatus = /*@__PURE__*/ (function (UpdateCacheStatus) {
        UpdateCacheStatus[UpdateCacheStatus["NOT_CACHED"] = 0] = "NOT_CACHED";
        UpdateCacheStatus[UpdateCacheStatus["CACHED_BUT_UNUSED"] = 1] = "CACHED_BUT_UNUSED";
        UpdateCacheStatus[UpdateCacheStatus["CACHED"] = 2] = "CACHED";
        return UpdateCacheStatus;
    })({});

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    class SwCriticalError extends Error {
        constructor() {
            super(...arguments);
            this.isCritical = true;
        }
    }
    function errorToString(error) {
        if (error instanceof Error) {
            return `${error.message}\n${error.stack}`;
        }
        else {
            return `${error}`;
        }
    }
    class SwUnrecoverableStateError extends SwCriticalError {
        constructor() {
            super(...arguments);
            this.isUnrecoverableState = true;
        }
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Compute the SHA1 of the given string
     *
     * see https://csrc.nist.gov/publications/fips/fips180-4/fips-180-4.pdf
     *
     * WARNING: this function has not been designed not tested with security in mind.
     *          DO NOT USE IT IN A SECURITY SENSITIVE CONTEXT.
     *
     * Borrowed from @angular/compiler/src/i18n/digest.ts
     */
    function sha1(str) {
        const utf8 = str;
        const words32 = stringToWords32(utf8, Endian.Big);
        return _sha1(words32, utf8.length * 8);
    }
    function sha1Binary(buffer) {
        const words32 = arrayBufferToWords32(buffer, Endian.Big);
        return _sha1(words32, buffer.byteLength * 8);
    }
    function _sha1(words32, len) {
        const w = [];
        let [a, b, c, d, e] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
        words32[len >> 5] |= 0x80 << (24 - len % 32);
        words32[((len + 64 >> 9) << 4) + 15] = len;
        for (let i = 0; i < words32.length; i += 16) {
            const [h0, h1, h2, h3, h4] = [a, b, c, d, e];
            for (let j = 0; j < 80; j++) {
                if (j < 16) {
                    w[j] = words32[i + j];
                }
                else {
                    w[j] = rol32(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
                }
                const [f, k] = fk(j, b, c, d);
                const temp = [rol32(a, 5), f, e, k, w[j]].reduce(add32);
                [e, d, c, b, a] = [d, c, rol32(b, 30), a, temp];
            }
            [a, b, c, d, e] = [add32(a, h0), add32(b, h1), add32(c, h2), add32(d, h3), add32(e, h4)];
        }
        return byteStringToHexString(words32ToByteString([a, b, c, d, e]));
    }
    function add32(a, b) {
        return add32to64(a, b)[1];
    }
    function add32to64(a, b) {
        const low = (a & 0xffff) + (b & 0xffff);
        const high = (a >>> 16) + (b >>> 16) + (low >>> 16);
        return [high >>> 16, (high << 16) | (low & 0xffff)];
    }
    // Rotate a 32b number left `count` position
    function rol32(a, count) {
        return (a << count) | (a >>> (32 - count));
    }
    var Endian = /*@__PURE__*/ (function (Endian) {
        Endian[Endian["Little"] = 0] = "Little";
        Endian[Endian["Big"] = 1] = "Big";
        return Endian;
    })({});
    function fk(index, b, c, d) {
        if (index < 20) {
            return [(b & c) | (~b & d), 0x5a827999];
        }
        if (index < 40) {
            return [b ^ c ^ d, 0x6ed9eba1];
        }
        if (index < 60) {
            return [(b & c) | (b & d) | (c & d), 0x8f1bbcdc];
        }
        return [b ^ c ^ d, 0xca62c1d6];
    }
    function stringToWords32(str, endian) {
        const size = (str.length + 3) >>> 2;
        const words32 = [];
        for (let i = 0; i < size; i++) {
            words32[i] = wordAt(str, i * 4, endian);
        }
        return words32;
    }
    function arrayBufferToWords32(buffer, endian) {
        const size = (buffer.byteLength + 3) >>> 2;
        const words32 = [];
        const view = new Uint8Array(buffer);
        for (let i = 0; i < size; i++) {
            words32[i] = wordAt(view, i * 4, endian);
        }
        return words32;
    }
    function byteAt(str, index) {
        if (typeof str === 'string') {
            return index >= str.length ? 0 : str.charCodeAt(index) & 0xff;
        }
        else {
            return index >= str.byteLength ? 0 : str[index] & 0xff;
        }
    }
    function wordAt(str, index, endian) {
        let word = 0;
        if (endian === Endian.Big) {
            for (let i = 0; i < 4; i++) {
                word += byteAt(str, index + i) << (24 - 8 * i);
            }
        }
        else {
            for (let i = 0; i < 4; i++) {
                word += byteAt(str, index + i) << 8 * i;
            }
        }
        return word;
    }
    function words32ToByteString(words32) {
        return words32.reduce((str, word) => str + word32ToByteString(word), '');
    }
    function word32ToByteString(word) {
        let str = '';
        for (let i = 0; i < 4; i++) {
            str += String.fromCharCode((word >>> 8 * (3 - i)) & 0xff);
        }
        return str;
    }
    function byteStringToHexString(str) {
        let hex = '';
        for (let i = 0; i < str.length; i++) {
            const b = byteAt(str, i);
            hex += (b >>> 4).toString(16) + (b & 0x0f).toString(16);
        }
        return hex.toLowerCase();
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * A group of assets that are cached in a `Cache` and managed by a given policy.
     *
     * Concrete classes derive from this base and specify the exact caching policy.
     */
    class AssetGroup {
        constructor(scope, adapter, idle, config, hashes, db, prefix) {
            this.scope = scope;
            this.adapter = adapter;
            this.idle = idle;
            this.config = config;
            this.hashes = hashes;
            this.db = db;
            this.prefix = prefix;
            /**
             * A deduplication cache, to make sure the SW never makes two network requests
             * for the same resource at once. Managed by `fetchAndCacheOnce`.
             */
            this.inFlightRequests = new Map();
            /**
             * Normalized resource URLs.
             */
            this.urls = [];
            /**
             * Regular expression patterns.
             */
            this.patterns = [];
            this.name = config.name;
            // Normalize the config's URLs to take the ServiceWorker's scope into account.
            this.urls = config.urls.map(url => adapter.normalizeUrl(url));
            // Patterns in the config are regular expressions disguised as strings. Breathe life into them.
            this.patterns = config.patterns.map(pattern => new RegExp(pattern));
            // This is the primary cache, which holds all of the cached requests for this group. If a
            // resource
            // isn't in this cache, it hasn't been fetched yet.
            this.cache = scope.caches.open(`${this.prefix}:${config.name}:cache`);
            // This is the metadata table, which holds specific information for each cached URL, such as
            // the timestamp of when it was added to the cache.
            this.metadata = this.db.open(`${this.prefix}:${config.name}:meta`, config.cacheQueryOptions);
        }
        cacheStatus(url) {
            return __awaiter(this, void 0, void 0, function* () {
                const cache = yield this.cache;
                const meta = yield this.metadata;
                const req = this.adapter.newRequest(url);
                const res = yield cache.match(req, this.config.cacheQueryOptions);
                if (res === undefined) {
                    return UpdateCacheStatus.NOT_CACHED;
                }
                try {
                    const data = yield meta.read(req.url);
                    if (!data.used) {
                        return UpdateCacheStatus.CACHED_BUT_UNUSED;
                    }
                }
                catch (_) {
                    // Error on the side of safety and assume cached.
                }
                return UpdateCacheStatus.CACHED;
            });
        }
        /**
         * Clean up all the cached data for this group.
         */
        cleanup() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.scope.caches.delete(`${this.prefix}:${this.config.name}:cache`);
                yield this.db.delete(`${this.prefix}:${this.config.name}:meta`);
            });
        }
        /**
         * Process a request for a given resource and return it, or return null if it's not available.
         */
        handleFetch(req, ctx) {
            return __awaiter(this, void 0, void 0, function* () {
                const url = this.adapter.normalizeUrl(req.url);
                // Either the request matches one of the known resource URLs, one of the patterns for
                // dynamically matched URLs, or neither. Determine which is the case for this request in
                // order to decide how to handle it.
                if (this.urls.indexOf(url) !== -1 || this.patterns.some(pattern => pattern.test(url))) {
                    // This URL matches a known resource. Either it's been cached already or it's missing, in
                    // which case it needs to be loaded from the network.
                    // Open the cache to check whether this resource is present.
                    const cache = yield this.cache;
                    // Look for a cached response. If one exists, it can be used to resolve the fetch
                    // operation.
                    const cachedResponse = yield cache.match(req, this.config.cacheQueryOptions);
                    if (cachedResponse !== undefined) {
                        // A response has already been cached (which presumably matches the hash for this
                        // resource). Check whether it's safe to serve this resource from cache.
                        if (this.hashes.has(url)) {
                            // This resource has a hash, and thus is versioned by the manifest. It's safe to return
                            // the response.
                            return cachedResponse;
                        }
                        else {
                            // This resource has no hash, and yet exists in the cache. Check how old this request is
                            // to make sure it's still usable.
                            if (yield this.needToRevalidate(req, cachedResponse)) {
                                this.idle.schedule(`revalidate(${this.prefix}, ${this.config.name}): ${req.url}`, () => __awaiter(this, void 0, void 0, function* () {
                                    yield this.fetchAndCacheOnce(req);
                                }));
                            }
                            // In either case (revalidation or not), the cached response must be good.
                            return cachedResponse;
                        }
                    }
                    // No already-cached response exists, so attempt a fetch/cache operation. The original request
                    // may specify things like credential inclusion, but for assets these are not honored in order
                    // to avoid issues with opaque responses. The SW requests the data itself.
                    const res = yield this.fetchAndCacheOnce(this.adapter.newRequest(req.url));
                    // If this is successful, the response needs to be cloned as it might be used to respond to
                    // multiple fetch operations at the same time.
                    return res.clone();
                }
                else {
                    return null;
                }
            });
        }
        /**
         * Some resources are cached without a hash, meaning that their expiration is controlled
         * by HTTP caching headers. Check whether the given request/response pair is still valid
         * per the caching headers.
         */
        needToRevalidate(req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                // Three different strategies apply here:
                // 1) The request has a Cache-Control header, and thus expiration needs to be based on its age.
                // 2) The request has an Expires header, and expiration is based on the current timestamp.
                // 3) The request has no applicable caching headers, and must be revalidated.
                if (res.headers.has('Cache-Control')) {
                    // Figure out if there is a max-age directive in the Cache-Control header.
                    const cacheControl = res.headers.get('Cache-Control');
                    const cacheDirectives = cacheControl
                        // Directives are comma-separated within the Cache-Control header value.
                        .split(',')
                        // Make sure each directive doesn't have extraneous whitespace.
                        .map(v => v.trim())
                        // Some directives have values (like maxage and s-maxage)
                        .map(v => v.split('='));
                    // Lowercase all the directive names.
                    cacheDirectives.forEach(v => v[0] = v[0].toLowerCase());
                    // Find the max-age directive, if one exists.
                    const maxAgeDirective = cacheDirectives.find(v => v[0] === 'max-age');
                    const cacheAge = maxAgeDirective ? maxAgeDirective[1] : undefined;
                    if (!cacheAge) {
                        // No usable TTL defined. Must assume that the response is stale.
                        return true;
                    }
                    try {
                        const maxAge = 1000 * parseInt(cacheAge);
                        // Determine the origin time of this request. If the SW has metadata on the request (which
                        // it
                        // should), it will have the time the request was added to the cache. If it doesn't for some
                        // reason, the request may have a Date header which will serve the same purpose.
                        let ts;
                        try {
                            // Check the metadata table. If a timestamp is there, use it.
                            const metaTable = yield this.metadata;
                            ts = (yield metaTable.read(req.url)).ts;
                        }
                        catch (_a) {
                            // Otherwise, look for a Date header.
                            const date = res.headers.get('Date');
                            if (date === null) {
                                // Unable to determine when this response was created. Assume that it's stale, and
                                // revalidate it.
                                return true;
                            }
                            ts = Date.parse(date);
                        }
                        const age = this.adapter.time - ts;
                        return age < 0 || age > maxAge;
                    }
                    catch (_b) {
                        // Assume stale.
                        return true;
                    }
                }
                else if (res.headers.has('Expires')) {
                    // Determine if the expiration time has passed.
                    const expiresStr = res.headers.get('Expires');
                    try {
                        // The request needs to be revalidated if the current time is later than the expiration
                        // time, if it parses correctly.
                        return this.adapter.time > Date.parse(expiresStr);
                    }
                    catch (_c) {
                        // The expiration date failed to parse, so revalidate as a precaution.
                        return true;
                    }
                }
                else {
                    // No way to evaluate staleness, so assume the response is already stale.
                    return true;
                }
            });
        }
        /**
         * Fetch the complete state of a cached resource, or return null if it's not found.
         */
        fetchFromCacheOnly(url) {
            return __awaiter(this, void 0, void 0, function* () {
                const cache = yield this.cache;
                const metaTable = yield this.metadata;
                // Lookup the response in the cache.
                const request = this.adapter.newRequest(url);
                const response = yield cache.match(request, this.config.cacheQueryOptions);
                if (response === undefined) {
                    // It's not found, return null.
                    return null;
                }
                // Next, lookup the cached metadata.
                let metadata = undefined;
                try {
                    metadata = yield metaTable.read(request.url);
                }
                catch (_a) {
                    // Do nothing, not found. This shouldn't happen, but it can be handled.
                }
                // Return both the response and any available metadata.
                return { response, metadata };
            });
        }
        /**
         * Lookup all resources currently stored in the cache which have no associated hash.
         */
        unhashedResources() {
            return __awaiter(this, void 0, void 0, function* () {
                const cache = yield this.cache;
                // Start with the set of all cached requests.
                return (yield cache.keys())
                    // Normalize their URLs.
                    .map(request => this.adapter.normalizeUrl(request.url))
                    // Exclude the URLs which have hashes.
                    .filter(url => !this.hashes.has(url));
            });
        }
        /**
         * Fetch the given resource from the network, and cache it if able.
         */
        fetchAndCacheOnce(req, used = true) {
            return __awaiter(this, void 0, void 0, function* () {
                // The `inFlightRequests` map holds information about which caching operations are currently
                // underway for known resources. If this request appears there, another "thread" is already
                // in the process of caching it, and this work should not be duplicated.
                if (this.inFlightRequests.has(req.url)) {
                    // There is a caching operation already in progress for this request. Wait for it to
                    // complete, and hopefully it will have yielded a useful response.
                    return this.inFlightRequests.get(req.url);
                }
                // No other caching operation is being attempted for this resource, so it will be owned here.
                // Go to the network and get the correct version.
                const fetchOp = this.fetchFromNetwork(req);
                // Save this operation in `inFlightRequests` so any other "thread" attempting to cache it
                // will block on this chain instead of duplicating effort.
                this.inFlightRequests.set(req.url, fetchOp);
                // Make sure this attempt is cleaned up properly on failure.
                try {
                    // Wait for a response. If this fails, the request will remain in `inFlightRequests`
                    // indefinitely.
                    const res = yield fetchOp;
                    // It's very important that only successful responses are cached. Unsuccessful responses
                    // should never be cached as this can completely break applications.
                    if (!res.ok) {
                        throw new Error(`Response not Ok (fetchAndCacheOnce): request for ${req.url} returned response ${res.status} ${res.statusText}`);
                    }
                    try {
                        // This response is safe to cache (as long as it's cloned). Wait until the cache operation
                        // is complete.
                        const cache = yield this.scope.caches.open(`${this.prefix}:${this.config.name}:cache`);
                        yield cache.put(req, res.clone());
                        // If the request is not hashed, update its metadata, especially the timestamp. This is
                        // needed for future determination of whether this cached response is stale or not.
                        if (!this.hashes.has(this.adapter.normalizeUrl(req.url))) {
                            // Metadata is tracked for requests that are unhashed.
                            const meta = { ts: this.adapter.time, used };
                            const metaTable = yield this.metadata;
                            yield metaTable.write(req.url, meta);
                        }
                        return res;
                    }
                    catch (err) {
                        // Among other cases, this can happen when the user clears all data through the DevTools,
                        // but the SW is still running and serving another tab. In that case, trying to write to the
                        // caches throws an `Entry was not found` error.
                        // If this happens the SW can no longer work correctly. This situation is unrecoverable.
                        throw new SwCriticalError(`Failed to update the caches for request to '${req.url}' (fetchAndCacheOnce): ${errorToString(err)}`);
                    }
                }
                finally {
                    // Finally, it can be removed from `inFlightRequests`. This might result in a double-remove
                    // if some other chain was already making this request too, but that won't hurt anything.
                    this.inFlightRequests.delete(req.url);
                }
            });
        }
        fetchFromNetwork(req, redirectLimit = 3) {
            return __awaiter(this, void 0, void 0, function* () {
                // Make a cache-busted request for the resource.
                const res = yield this.cacheBustedFetchFromNetwork(req);
                // Check for redirected responses, and follow the redirects.
                if (res['redirected'] && !!res.url) {
                    // If the redirect limit is exhausted, fail with an error.
                    if (redirectLimit === 0) {
                        throw new SwCriticalError(`Response hit redirect limit (fetchFromNetwork): request redirected too many times, next is ${res.url}`);
                    }
                    // Unwrap the redirect directly.
                    return this.fetchFromNetwork(this.adapter.newRequest(res.url), redirectLimit - 1);
                }
                return res;
            });
        }
        /**
         * Load a particular asset from the network, accounting for hash validation.
         */
        cacheBustedFetchFromNetwork(req) {
            return __awaiter(this, void 0, void 0, function* () {
                const url = this.adapter.normalizeUrl(req.url);
                // If a hash is available for this resource, then compare the fetched version with the
                // canonical hash. Otherwise, the network version will have to be trusted.
                if (this.hashes.has(url)) {
                    // It turns out this resource does have a hash. Look it up. Unless the fetched version
                    // matches this hash, it's invalid and the whole manifest may need to be thrown out.
                    const canonicalHash = this.hashes.get(url);
                    // Ideally, the resource would be requested with cache-busting to guarantee the SW gets
                    // the freshest version. However, doing this would eliminate any chance of the response
                    // being in the HTTP cache. Given that the browser has recently actively loaded the page,
                    // it's likely that many of the responses the SW needs to cache are in the HTTP cache and
                    // are fresh enough to use. In the future, this could be done by setting cacheMode to
                    // *only* check the browser cache for a cached version of the resource, when cacheMode is
                    // fully supported. For now, the resource is fetched directly, without cache-busting, and
                    // if the hash test fails a cache-busted request is tried before concluding that the
                    // resource isn't correct. This gives the benefit of acceleration via the HTTP cache
                    // without the risk of stale data, at the expense of a duplicate request in the event of
                    // a stale response.
                    // Fetch the resource from the network (possibly hitting the HTTP cache).
                    let response = yield this.safeFetch(req);
                    // Decide whether a cache-busted request is necessary. A cache-busted request is necessary
                    // only if the request was successful but the hash of the retrieved contents does not match
                    // the canonical hash from the manifest.
                    let makeCacheBustedRequest = response.ok;
                    if (makeCacheBustedRequest) {
                        // The request was successful. A cache-busted request is only necessary if the hashes
                        // don't match.
                        // (Make sure to clone the response so it can be used later if it proves to be valid.)
                        const fetchedHash = sha1Binary(yield response.clone().arrayBuffer());
                        makeCacheBustedRequest = (fetchedHash !== canonicalHash);
                    }
                    // Make a cache busted request to the network, if necessary.
                    if (makeCacheBustedRequest) {
                        // Hash failure, the version that was retrieved under the default URL did not have the
                        // hash expected. This could be because the HTTP cache got in the way and returned stale
                        // data, or because the version on the server really doesn't match. A cache-busting
                        // request will differentiate these two situations.
                        // TODO: handle case where the URL has parameters already (unlikely for assets).
                        const cacheBustReq = this.adapter.newRequest(this.cacheBust(req.url));
                        response = yield this.safeFetch(cacheBustReq);
                        // If the response was successful, check the contents against the canonical hash.
                        if (response.ok) {
                            // Hash the contents.
                            // (Make sure to clone the response so it can be used later if it proves to be valid.)
                            const cacheBustedHash = sha1Binary(yield response.clone().arrayBuffer());
                            // If the cache-busted version doesn't match, then the manifest is not an accurate
                            // representation of the server's current set of files, and the SW should give up.
                            if (canonicalHash !== cacheBustedHash) {
                                throw new SwCriticalError(`Hash mismatch (cacheBustedFetchFromNetwork): ${req.url}: expected ${canonicalHash}, got ${cacheBustedHash} (after cache busting)`);
                            }
                        }
                    }
                    // At this point, `response` is either successful with a matching hash or is unsuccessful.
                    // Before returning it, check whether it failed with a 404 status. This would signify an
                    // unrecoverable state.
                    if (!response.ok && (response.status === 404)) {
                        throw new SwUnrecoverableStateError(`Failed to retrieve hashed resource from the server. (AssetGroup: ${this.config.name} | URL: ${url})`);
                    }
                    // Return the response (successful or unsuccessful).
                    return response;
                }
                else {
                    // This URL doesn't exist in our hash database, so it must be requested directly.
                    return this.safeFetch(req);
                }
            });
        }
        /**
         * Possibly update a resource, if it's expired and needs to be updated. A no-op otherwise.
         */
        maybeUpdate(updateFrom, req, cache) {
            return __awaiter(this, void 0, void 0, function* () {
                const url = this.adapter.normalizeUrl(req.url);
                const meta = yield this.metadata;
                // Check if this resource is hashed and already exists in the cache of a prior version.
                if (this.hashes.has(url)) {
                    const hash = this.hashes.get(url);
                    // Check the caches of prior versions, using the hash to ensure the correct version of
                    // the resource is loaded.
                    const res = yield updateFrom.lookupResourceWithHash(url, hash);
                    // If a previously cached version was available, copy it over to this cache.
                    if (res !== null) {
                        // Copy to this cache.
                        yield cache.put(req, res);
                        yield meta.write(req.url, { ts: this.adapter.time, used: false });
                        // No need to do anything further with this resource, it's now cached properly.
                        return true;
                    }
                }
                // No up-to-date version of this resource could be found.
                return false;
            });
        }
        /**
         * Construct a cache-busting URL for a given URL.
         */
        cacheBust(url) {
            return url + (url.indexOf('?') === -1 ? '?' : '&') + 'ngsw-cache-bust=' + Math.random();
        }
        safeFetch(req) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield this.scope.fetch(req);
                }
                catch (_a) {
                    return this.adapter.newResponse('', {
                        status: 504,
                        statusText: 'Gateway Timeout',
                    });
                }
            });
        }
    }
    /**
     * An `AssetGroup` that prefetches all of its resources during initialization.
     */
    class PrefetchAssetGroup extends AssetGroup {
        initializeFully(updateFrom) {
            return __awaiter(this, void 0, void 0, function* () {
                // Open the cache which actually holds requests.
                const cache = yield this.cache;
                // Cache all known resources serially. As this reduce proceeds, each Promise waits
                // on the last before starting the fetch/cache operation for the next request. Any
                // errors cause fall-through to the final Promise which rejects.
                yield this.urls.reduce((previous, url) => __awaiter(this, void 0, void 0, function* () {
                    // Wait on all previous operations to complete.
                    yield previous;
                    // Construct the Request for this url.
                    const req = this.adapter.newRequest(url);
                    // First, check the cache to see if there is already a copy of this resource.
                    const alreadyCached = (yield cache.match(req, this.config.cacheQueryOptions)) !== undefined;
                    // If the resource is in the cache already, it can be skipped.
                    if (alreadyCached) {
                        return;
                    }
                    // If an update source is available.
                    if (updateFrom !== undefined && (yield this.maybeUpdate(updateFrom, req, cache))) {
                        return;
                    }
                    // Otherwise, go to the network and hopefully cache the response (if successful).
                    yield this.fetchAndCacheOnce(req, false);
                }), Promise.resolve());
                // Handle updating of unknown (unhashed) resources. This is only possible if there's
                // a source to update from.
                if (updateFrom !== undefined) {
                    const metaTable = yield this.metadata;
                    // Select all of the previously cached resources. These are cached unhashed resources
                    // from previous versions of the app, in any asset group.
                    yield (yield updateFrom.previouslyCachedResources())
                        // First, narrow down the set of resources to those which are handled by this group.
                        // Either it's a known URL, or it matches a given pattern.
                        .filter(url => this.urls.indexOf(url) !== -1 || this.patterns.some(pattern => pattern.test(url)))
                        // Finally, process each resource in turn.
                        .reduce((previous, url) => __awaiter(this, void 0, void 0, function* () {
                        yield previous;
                        const req = this.adapter.newRequest(url);
                        // It's possible that the resource in question is already cached. If so,
                        // continue to the next one.
                        const alreadyCached = ((yield cache.match(req, this.config.cacheQueryOptions)) !== undefined);
                        if (alreadyCached) {
                            return;
                        }
                        // Get the most recent old version of the resource.
                        const res = yield updateFrom.lookupResourceWithoutHash(url);
                        if (res === null || res.metadata === undefined) {
                            // Unexpected, but not harmful.
                            return;
                        }
                        // Write it into the cache. It may already be expired, but it can still serve
                        // traffic until it's updated (stale-while-revalidate approach).
                        yield cache.put(req, res.response);
                        yield metaTable.write(req.url, Object.assign(Object.assign({}, res.metadata), { used: false }));
                    }), Promise.resolve());
                }
            });
        }
    }
    class LazyAssetGroup extends AssetGroup {
        initializeFully(updateFrom) {
            return __awaiter(this, void 0, void 0, function* () {
                // No action necessary if no update source is available - resources managed in this group
                // are all lazily loaded, so there's nothing to initialize.
                if (updateFrom === undefined) {
                    return;
                }
                // Open the cache which actually holds requests.
                const cache = yield this.cache;
                // Loop through the listed resources, caching any which are available.
                yield this.urls.reduce((previous, url) => __awaiter(this, void 0, void 0, function* () {
                    // Wait on all previous operations to complete.
                    yield previous;
                    // Construct the Request for this url.
                    const req = this.adapter.newRequest(url);
                    // First, check the cache to see if there is already a copy of this resource.
                    const alreadyCached = (yield cache.match(req, this.config.cacheQueryOptions)) !== undefined;
                    // If the resource is in the cache already, it can be skipped.
                    if (alreadyCached) {
                        return;
                    }
                    const updated = yield this.maybeUpdate(updateFrom, req, cache);
                    if (this.config.updateMode === 'prefetch' && !updated) {
                        // If the resource was not updated, either it was not cached before or
                        // the previously cached version didn't match the updated hash. In that
                        // case, prefetch update mode dictates that the resource will be updated,
                        // except if it was not previously utilized. Check the status of the
                        // cached resource to see.
                        const cacheStatus = yield updateFrom.recentCacheStatus(url);
                        // If the resource is not cached, or was cached but unused, then it will be
                        // loaded lazily.
                        if (cacheStatus !== UpdateCacheStatus.CACHED) {
                            return;
                        }
                        // Update from the network.
                        yield this.fetchAndCacheOnce(req, false);
                    }
                }), Promise.resolve());
            });
        }
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    /**
     * Manages an instance of `LruState` and moves URLs to the head of the
     * chain when requested.
     */
    class LruList {
        constructor(state) {
            if (state === undefined) {
                state = {
                    head: null,
                    tail: null,
                    map: {},
                    count: 0,
                };
            }
            this.state = state;
        }
        /**
         * The current count of URLs in the list.
         */
        get size() {
            return this.state.count;
        }
        /**
         * Remove the tail.
         */
        pop() {
            // If there is no tail, return null.
            if (this.state.tail === null) {
                return null;
            }
            const url = this.state.tail;
            this.remove(url);
            // This URL has been successfully evicted.
            return url;
        }
        remove(url) {
            const node = this.state.map[url];
            if (node === undefined) {
                return false;
            }
            // Special case if removing the current head.
            if (this.state.head === url) {
                // The node is the current head. Special case the removal.
                if (node.next === null) {
                    // This is the only node. Reset the cache to be empty.
                    this.state.head = null;
                    this.state.tail = null;
                    this.state.map = {};
                    this.state.count = 0;
                    return true;
                }
                // There is at least one other node. Make the next node the new head.
                const next = this.state.map[node.next];
                next.previous = null;
                this.state.head = next.url;
                node.next = null;
                delete this.state.map[url];
                this.state.count--;
                return true;
            }
            // The node is not the head, so it has a previous. It may or may not be the tail.
            // If it is not, then it has a next. First, grab the previous node.
            const previous = this.state.map[node.previous];
            // Fix the forward pointer to skip over node and go directly to node.next.
            previous.next = node.next;
            // node.next may or may not be set. If it is, fix the back pointer to skip over node.
            // If it's not set, then this node happened to be the tail, and the tail needs to be
            // updated to point to the previous node (removing the tail).
            if (node.next !== null) {
                // There is a next node, fix its back pointer to skip this node.
                this.state.map[node.next].previous = node.previous;
            }
            else {
                // There is no next node - the accessed node must be the tail. Move the tail pointer.
                this.state.tail = node.previous;
            }
            node.next = null;
            node.previous = null;
            delete this.state.map[url];
            // Count the removal.
            this.state.count--;
            return true;
        }
        accessed(url) {
            // When a URL is accessed, its node needs to be moved to the head of the chain.
            // This is accomplished in two steps:
            //
            // 1) remove the node from its position within the chain.
            // 2) insert the node as the new head.
            //
            // Sometimes, a URL is accessed which has not been seen before. In this case, step 1 can
            // be skipped completely (which will grow the chain by one). Of course, if the node is
            // already the head, this whole operation can be skipped.
            if (this.state.head === url) {
                // The URL is already in the head position, accessing it is a no-op.
                return;
            }
            // Look up the node in the map, and construct a new entry if it's
            const node = this.state.map[url] || { url, next: null, previous: null };
            // Step 1: remove the node from its position within the chain, if it is in the chain.
            if (this.state.map[url] !== undefined) {
                this.remove(url);
            }
            // Step 2: insert the node at the head of the chain.
            // First, check if there's an existing head node. If there is, it has previous: null.
            // Its previous pointer should be set to the node we're inserting.
            if (this.state.head !== null) {
                this.state.map[this.state.head].previous = url;
            }
            // The next pointer of the node being inserted gets set to the old head, before the head
            // pointer is updated to this node.
            node.next = this.state.head;
            // The new head is the new node.
            this.state.head = url;
            // If there is no tail, then this is the first node, and is both the head and the tail.
            if (this.state.tail === null) {
                this.state.tail = url;
            }
            // Set the node in the map of nodes (if the URL has been seen before, this is a no-op)
            // and count the insertion.
            this.state.map[url] = node;
            this.state.count++;
        }
    }
    /**
     * A group of cached resources determined by a set of URL patterns which follow a LRU policy
     * for caching.
     */
    class DataGroup {
        constructor(scope, adapter, config, db, debugHandler, prefix) {
            this.scope = scope;
            this.adapter = adapter;
            this.config = config;
            this.db = db;
            this.debugHandler = debugHandler;
            this.prefix = prefix;
            /**
             * Tracks the LRU state of resources in this cache.
             */
            this._lru = null;
            this.patterns = this.config.patterns.map(pattern => new RegExp(pattern));
            this.cache = this.scope.caches.open(`${this.prefix}:dynamic:${this.config.name}:cache`);
            this.lruTable = this.db.open(`${this.prefix}:dynamic:${this.config.name}:lru`, this.config.cacheQueryOptions);
            this.ageTable = this.db.open(`${this.prefix}:dynamic:${this.config.name}:age`, this.config.cacheQueryOptions);
        }
        /**
         * Lazily initialize/load the LRU chain.
         */
        lru() {
            return __awaiter(this, void 0, void 0, function* () {
                if (this._lru === null) {
                    const table = yield this.lruTable;
                    try {
                        this._lru = new LruList(yield table.read('lru'));
                    }
                    catch (_a) {
                        this._lru = new LruList();
                    }
                }
                return this._lru;
            });
        }
        /**
         * Sync the LRU chain to non-volatile storage.
         */
        syncLru() {
            return __awaiter(this, void 0, void 0, function* () {
                if (this._lru === null) {
                    return;
                }
                const table = yield this.lruTable;
                try {
                    return table.write('lru', this._lru.state);
                }
                catch (err) {
                    // Writing lru cache table failed. This could be a result of a full storage.
                    // Continue serving clients as usual.
                    this.debugHandler.log(err, `DataGroup(${this.config.name}@${this.config.version}).syncLru()`);
                    // TODO: Better detect/handle full storage; e.g. using
                    // [navigator.storage](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorStorage/storage).
                }
            });
        }
        /**
         * Process a fetch event and return a `Response` if the resource is covered by this group,
         * or `null` otherwise.
         */
        handleFetch(req, ctx) {
            return __awaiter(this, void 0, void 0, function* () {
                // Do nothing
                if (!this.patterns.some(pattern => pattern.test(req.url))) {
                    return null;
                }
                // Lazily initialize the LRU cache.
                const lru = yield this.lru();
                // The URL matches this cache. First, check whether this is a mutating request or not.
                switch (req.method) {
                    case 'OPTIONS':
                        // Don't try to cache this - it's non-mutating, but is part of a mutating request.
                        // Most likely SWs don't even see this, but this guard is here just in case.
                        return null;
                    case 'GET':
                    case 'HEAD':
                        // Handle the request with whatever strategy was selected.
                        switch (this.config.strategy) {
                            case 'freshness':
                                return this.handleFetchWithFreshness(req, ctx, lru);
                            case 'performance':
                                return this.handleFetchWithPerformance(req, ctx, lru);
                            default:
                                throw new Error(`Unknown strategy: ${this.config.strategy}`);
                        }
                    default:
                        // This was a mutating request. Assume the cache for this URL is no longer valid.
                        const wasCached = lru.remove(req.url);
                        // If there was a cached entry, remove it.
                        if (wasCached) {
                            yield this.clearCacheForUrl(req.url);
                        }
                        // Sync the LRU chain to non-volatile storage.
                        yield this.syncLru();
                        // Finally, fall back on the network.
                        return this.safeFetch(req);
                }
            });
        }
        handleFetchWithPerformance(req, ctx, lru) {
            return __awaiter(this, void 0, void 0, function* () {
                let res = null;
                // Check the cache first. If the resource exists there (and is not expired), the cached
                // version can be used.
                const fromCache = yield this.loadFromCache(req, lru);
                if (fromCache !== null) {
                    res = fromCache.res;
                    // Check the age of the resource.
                    if (this.config.refreshAheadMs !== undefined && fromCache.age >= this.config.refreshAheadMs) {
                        ctx.waitUntil(this.safeCacheResponse(req, this.safeFetch(req), lru));
                    }
                }
                if (res !== null) {
                    return res;
                }
                // No match from the cache. Go to the network. Note that this is not an 'await'
                // call, networkFetch is the actual Promise. This is due to timeout handling.
                const [timeoutFetch, networkFetch] = this.networkFetchWithTimeout(req);
                res = yield timeoutFetch;
                // Since fetch() will always return a response, undefined indicates a timeout.
                if (res === undefined) {
                    // The request timed out. Return a Gateway Timeout error.
                    res = this.adapter.newResponse(null, { status: 504, statusText: 'Gateway Timeout' });
                    // Cache the network response eventually.
                    ctx.waitUntil(this.safeCacheResponse(req, networkFetch, lru));
                }
                else {
                    // The request completed in time, so cache it inline with the response flow.
                    yield this.safeCacheResponse(req, res, lru);
                }
                return res;
            });
        }
        handleFetchWithFreshness(req, ctx, lru) {
            return __awaiter(this, void 0, void 0, function* () {
                // Start with a network fetch.
                const [timeoutFetch, networkFetch] = this.networkFetchWithTimeout(req);
                let res;
                // If that fetch errors, treat it as a timed out request.
                try {
                    res = yield timeoutFetch;
                }
                catch (_a) {
                    res = undefined;
                }
                // If the network fetch times out or errors, fall back on the cache.
                if (res === undefined) {
                    ctx.waitUntil(this.safeCacheResponse(req, networkFetch, lru, true));
                    // Ignore the age, the network response will be cached anyway due to the
                    // behavior of freshness.
                    const fromCache = yield this.loadFromCache(req, lru);
                    res = (fromCache !== null) ? fromCache.res : null;
                }
                else {
                    yield this.safeCacheResponse(req, res, lru, true);
                }
                // Either the network fetch didn't time out, or the cache yielded a usable response.
                // In either case, use it.
                if (res !== null) {
                    return res;
                }
                // No response in the cache. No choice but to fall back on the full network fetch.
                return networkFetch;
            });
        }
        networkFetchWithTimeout(req) {
            // If there is a timeout configured, race a timeout Promise with the network fetch.
            // Otherwise, just fetch from the network directly.
            if (this.config.timeoutMs !== undefined) {
                const networkFetch = this.scope.fetch(req);
                const safeNetworkFetch = (() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        return yield networkFetch;
                    }
                    catch (_a) {
                        return this.adapter.newResponse(null, {
                            status: 504,
                            statusText: 'Gateway Timeout',
                        });
                    }
                }))();
                const networkFetchUndefinedError = (() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        return yield networkFetch;
                    }
                    catch (_b) {
                        return undefined;
                    }
                }))();
                // Construct a Promise<undefined> for the timeout.
                const timeout = this.adapter.timeout(this.config.timeoutMs);
                // Race that with the network fetch. This will either be a Response, or `undefined`
                // in the event that the request errored or timed out.
                return [Promise.race([networkFetchUndefinedError, timeout]), safeNetworkFetch];
            }
            else {
                const networkFetch = this.safeFetch(req);
                // Do a plain fetch.
                return [networkFetch, networkFetch];
            }
        }
        safeCacheResponse(req, resOrPromise, lru, okToCacheOpaque) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const res = yield resOrPromise;
                    try {
                        yield this.cacheResponse(req, res, lru, okToCacheOpaque);
                    }
                    catch (err) {
                        // Saving the API response failed. This could be a result of a full storage.
                        // Since this data is cached lazily and temporarily, continue serving clients as usual.
                        this.debugHandler.log(err, `DataGroup(${this.config.name}@${this.config.version}).safeCacheResponse(${req.url}, status: ${res.status})`);
                        // TODO: Better detect/handle full storage; e.g. using
                        // [navigator.storage](https://developer.mozilla.org/en-US/docs/Web/API/NavigatorStorage/storage).
                    }
                }
                catch (_a) {
                    // Request failed
                    // TODO: Handle this error somehow?
                }
            });
        }
        loadFromCache(req, lru) {
            return __awaiter(this, void 0, void 0, function* () {
                // Look for a response in the cache. If one exists, return it.
                const cache = yield this.cache;
                let res = yield cache.match(req, this.config.cacheQueryOptions);
                if (res !== undefined) {
                    // A response was found in the cache, but its age is not yet known. Look it up.
                    try {
                        const ageTable = yield this.ageTable;
                        const age = this.adapter.time - (yield ageTable.read(req.url)).age;
                        // If the response is young enough, use it.
                        if (age <= this.config.maxAge) {
                            // Successful match from the cache. Use the response, after marking it as having
                            // been accessed.
                            lru.accessed(req.url);
                            return { res, age };
                        }
                        // Otherwise, or if there was an error, assume the response is expired, and evict it.
                    }
                    catch (_a) {
                        // Some error getting the age for the response. Assume it's expired.
                    }
                    lru.remove(req.url);
                    yield this.clearCacheForUrl(req.url);
                    // TODO: avoid duplicate in event of network timeout, maybe.
                    yield this.syncLru();
                }
                return null;
            });
        }
        /**
         * Operation for caching the response from the server. This has to happen all
         * at once, so that the cache and LRU tracking remain in sync. If the network request
         * completes before the timeout, this logic will be run inline with the response flow.
         * If the request times out on the server, an error will be returned but the real network
         * request will still be running in the background, to be cached when it completes.
         */
        cacheResponse(req, res, lru, okToCacheOpaque = false) {
            return __awaiter(this, void 0, void 0, function* () {
                // Only cache successful responses.
                if (!(res.ok || (okToCacheOpaque && res.type === 'opaque'))) {
                    return;
                }
                // If caching this response would make the cache exceed its maximum size, evict something
                // first.
                if (lru.size >= this.config.maxSize) {
                    // The cache is too big, evict something.
                    const evictedUrl = lru.pop();
                    if (evictedUrl !== null) {
                        yield this.clearCacheForUrl(evictedUrl);
                    }
                }
                // TODO: evaluate for possible race conditions during flaky network periods.
                // Mark this resource as having been accessed recently. This ensures it won't be evicted
                // until enough other resources are requested that it falls off the end of the LRU chain.
                lru.accessed(req.url);
                // Store the response in the cache (cloning because the browser will consume
                // the body during the caching operation).
                yield (yield this.cache).put(req, res.clone());
                // Store the age of the cache.
                const ageTable = yield this.ageTable;
                yield ageTable.write(req.url, { age: this.adapter.time });
                // Sync the LRU chain to non-volatile storage.
                yield this.syncLru();
            });
        }
        /**
         * Delete all of the saved state which this group uses to track resources.
         */
        cleanup() {
            return __awaiter(this, void 0, void 0, function* () {
                // Remove both the cache and the database entries which track LRU stats.
                yield Promise.all([
                    this.scope.caches.delete(`${this.prefix}:dynamic:${this.config.name}:cache`),
                    this.db.delete(`${this.prefix}:dynamic:${this.config.name}:age`),
                    this.db.delete(`${this.prefix}:dynamic:${this.config.name}:lru`),
                ]);
            });
        }
        /**
         * Clear the state of the cache for a particular resource.
         *
         * This doesn't remove the resource from the LRU table, that is assumed to have
         * been done already. This clears the GET and HEAD versions of the request from
         * the cache itself, as well as the metadata stored in the age table.
         */
        clearCacheForUrl(url) {
            return __awaiter(this, void 0, void 0, function* () {
                const [cache, ageTable] = yield Promise.all([this.cache, this.ageTable]);
                yield Promise.all([
                    cache.delete(this.adapter.newRequest(url, { method: 'GET' }), this.config.cacheQueryOptions),
                    cache.delete(this.adapter.newRequest(url, { method: 'HEAD' }), this.config.cacheQueryOptions),
                    ageTable.delete(url),
                ]);
            });
        }
        safeFetch(req) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return this.scope.fetch(req);
                }
                catch (_a) {
                    return this.adapter.newResponse(null, {
                        status: 504,
                        statusText: 'Gateway Timeout',
                    });
                }
            });
        }
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    const BACKWARDS_COMPATIBILITY_NAVIGATION_URLS = [
        { positive: true, regex: '^/.*$' },
        { positive: false, regex: '^/.*\\.[^/]*$' },
        { positive: false, regex: '^/.*__' },
    ];
    /**
     * A specific version of the application, identified by a unique manifest
     * as determined by its hash.
     *
     * Each `AppVersion` can be thought of as a published version of the app
     * that can be installed as an update to any previously installed versions.
     */
    class AppVersion {
        constructor(scope, adapter, database, idle, debugHandler, manifest, manifestHash) {
            this.scope = scope;
            this.adapter = adapter;
            this.database = database;
            this.idle = idle;
            this.debugHandler = debugHandler;
            this.manifest = manifest;
            this.manifestHash = manifestHash;
            /**
             * A Map of absolute URL paths (`/foo.txt`) to the known hash of their contents (if available).
             */
            this.hashTable = new Map();
            /**
             * The normalized URL to the file that serves as the index page to satisfy navigation requests.
             * Usually this is `/index.html`.
             */
            this.indexUrl = this.adapter.normalizeUrl(this.manifest.index);
            /**
             * Tracks whether the manifest has encountered any inconsistencies.
             */
            this._okay = true;
            // The hashTable within the manifest is an Object - convert it to a Map for easier lookups.
            Object.keys(this.manifest.hashTable).forEach(url => {
                this.hashTable.set(adapter.normalizeUrl(url), this.manifest.hashTable[url]);
            });
            // Process each `AssetGroup` declared in the manifest. Each declared group gets an `AssetGroup`
            // instance
            // created for it, of a type that depends on the configuration mode.
            this.assetGroups = (manifest.assetGroups || []).map(config => {
                // Every asset group has a cache that's prefixed by the manifest hash and the name of the
                // group.
                const prefix = `${adapter.cacheNamePrefix}:${this.manifestHash}:assets`;
                // Check the caching mode, which determines when resources will be fetched/updated.
                switch (config.installMode) {
                    case 'prefetch':
                        return new PrefetchAssetGroup(this.scope, this.adapter, this.idle, config, this.hashTable, this.database, prefix);
                    case 'lazy':
                        return new LazyAssetGroup(this.scope, this.adapter, this.idle, config, this.hashTable, this.database, prefix);
                }
            });
            // Process each `DataGroup` declared in the manifest.
            this.dataGroups =
                (manifest.dataGroups || [])
                    .map(config => new DataGroup(this.scope, this.adapter, config, this.database, this.debugHandler, `${adapter.cacheNamePrefix}:${config.version}:data`));
            // This keeps backwards compatibility with app versions without navigation urls.
            // Fix: https://github.com/angular/angular/issues/27209
            manifest.navigationUrls = manifest.navigationUrls || BACKWARDS_COMPATIBILITY_NAVIGATION_URLS;
            // Create `include`/`exclude` RegExps for the `navigationUrls` declared in the manifest.
            const includeUrls = manifest.navigationUrls.filter(spec => spec.positive);
            const excludeUrls = manifest.navigationUrls.filter(spec => !spec.positive);
            this.navigationUrls = {
                include: includeUrls.map(spec => new RegExp(spec.regex)),
                exclude: excludeUrls.map(spec => new RegExp(spec.regex)),
            };
        }
        get okay() {
            return this._okay;
        }
        /**
         * Fully initialize this version of the application. If this Promise resolves successfully, all
         * required
         * data has been safely downloaded.
         */
        initializeFully(updateFrom) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    // Fully initialize each asset group, in series. Starts with an empty Promise,
                    // and waits for the previous groups to have been initialized before initializing
                    // the next one in turn.
                    yield this.assetGroups.reduce((previous, group) => __awaiter(this, void 0, void 0, function* () {
                        // Wait for the previous groups to complete initialization. If there is a
                        // failure, this will throw, and each subsequent group will throw, until the
                        // whole sequence fails.
                        yield previous;
                        // Initialize this group.
                        return group.initializeFully(updateFrom);
                    }), Promise.resolve());
                }
                catch (err) {
                    this._okay = false;
                    throw err;
                }
            });
        }
        handleFetch(req, context) {
            return __awaiter(this, void 0, void 0, function* () {
                // Check the request against each `AssetGroup` in sequence. If an `AssetGroup` can't handle the
                // request,
                // it will return `null`. Thus, the first non-null response is the SW's answer to the request.
                // So reduce
                // the group list, keeping track of a possible response. If there is one, it gets passed
                // through, and if
                // not the next group is consulted to produce a candidate response.
                const asset = yield this.assetGroups.reduce((potentialResponse, group) => __awaiter(this, void 0, void 0, function* () {
                    // Wait on the previous potential response. If it's not null, it should just be passed
                    // through.
                    const resp = yield potentialResponse;
                    if (resp !== null) {
                        return resp;
                    }
                    // No response has been found yet. Maybe this group will have one.
                    return group.handleFetch(req, context);
                }), Promise.resolve(null));
                // The result of the above is the asset response, if there is any, or null otherwise. Return the
                // asset
                // response if there was one. If not, check with the data caching groups.
                if (asset !== null) {
                    return asset;
                }
                // Perform the same reduction operation as above, but this time processing
                // the data caching groups.
                const data = yield this.dataGroups.reduce((potentialResponse, group) => __awaiter(this, void 0, void 0, function* () {
                    const resp = yield potentialResponse;
                    if (resp !== null) {
                        return resp;
                    }
                    return group.handleFetch(req, context);
                }), Promise.resolve(null));
                // If the data caching group returned a response, go with it.
                if (data !== null) {
                    return data;
                }
                // Next, check if this is a navigation request for a route. Detect circular
                // navigations by checking if the request URL is the same as the index URL.
                if (this.adapter.normalizeUrl(req.url) !== this.indexUrl && this.isNavigationRequest(req)) {
                    if (this.manifest.navigationRequestStrategy === 'freshness') {
                        // For navigation requests the freshness was configured. The request will always go trough
                        // the network and fallback to default `handleFetch` behavior in case of failure.
                        try {
                            return yield this.scope.fetch(req);
                        }
                        catch (_a) {
                            // Navigation request failed - application is likely offline.
                            // Proceed forward to the default `handleFetch` behavior, where
                            // `indexUrl` will be requested and it should be available in the cache.
                        }
                    }
                    // This was a navigation request. Re-enter `handleFetch` with a request for
                    // the URL.
                    return this.handleFetch(this.adapter.newRequest(this.indexUrl), context);
                }
                return null;
            });
        }
        /**
         * Determine whether the request is a navigation request.
         * Takes into account: Request mode, `Accept` header, `navigationUrls` patterns.
         */
        isNavigationRequest(req) {
            if (req.mode !== 'navigate') {
                return false;
            }
            if (!this.acceptsTextHtml(req)) {
                return false;
            }
            const urlPrefix = this.scope.registration.scope.replace(/\/$/, '');
            const url = req.url.startsWith(urlPrefix) ? req.url.substr(urlPrefix.length) : req.url;
            const urlWithoutQueryOrHash = url.replace(/[?#].*$/, '');
            return this.navigationUrls.include.some(regex => regex.test(urlWithoutQueryOrHash)) &&
                !this.navigationUrls.exclude.some(regex => regex.test(urlWithoutQueryOrHash));
        }
        /**
         * Check this version for a given resource with a particular hash.
         */
        lookupResourceWithHash(url, hash) {
            return __awaiter(this, void 0, void 0, function* () {
                // Verify that this version has the requested resource cached. If not,
                // there's no point in trying.
                if (!this.hashTable.has(url)) {
                    return null;
                }
                // Next, check whether the resource has the correct hash. If not, any cached
                // response isn't usable.
                if (this.hashTable.get(url) !== hash) {
                    return null;
                }
                const cacheState = yield this.lookupResourceWithoutHash(url);
                return cacheState && cacheState.response;
            });
        }
        /**
         * Check this version for a given resource regardless of its hash.
         */
        lookupResourceWithoutHash(url) {
            // Limit the search to asset groups, and only scan the cache, don't
            // load resources from the network.
            return this.assetGroups.reduce((potentialResponse, group) => __awaiter(this, void 0, void 0, function* () {
                const resp = yield potentialResponse;
                if (resp !== null) {
                    return resp;
                }
                // fetchFromCacheOnly() avoids any network fetches, and returns the
                // full set of cache data, not just the Response.
                return group.fetchFromCacheOnly(url);
            }), Promise.resolve(null));
        }
        /**
         * List all unhashed resources from all asset groups.
         */
        previouslyCachedResources() {
            return this.assetGroups.reduce((resources, group) => __awaiter(this, void 0, void 0, function* () { return (yield resources).concat(yield group.unhashedResources()); }), Promise.resolve([]));
        }
        recentCacheStatus(url) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.assetGroups.reduce((current, group) => __awaiter(this, void 0, void 0, function* () {
                    const status = yield current;
                    if (status === UpdateCacheStatus.CACHED) {
                        return status;
                    }
                    const groupStatus = yield group.cacheStatus(url);
                    if (groupStatus === UpdateCacheStatus.NOT_CACHED) {
                        return status;
                    }
                    return groupStatus;
                }), Promise.resolve(UpdateCacheStatus.NOT_CACHED));
            });
        }
        /**
         * Erase this application version, by cleaning up all the caches.
         */
        cleanup() {
            return __awaiter(this, void 0, void 0, function* () {
                yield Promise.all(this.assetGroups.map(group => group.cleanup()));
                yield Promise.all(this.dataGroups.map(group => group.cleanup()));
            });
        }
        /**
         * Get the opaque application data which was provided with the manifest.
         */
        get appData() {
            return this.manifest.appData || null;
        }
        /**
         * Check whether a request accepts `text/html` (based on the `Accept` header).
         */
        acceptsTextHtml(req) {
            const accept = req.headers.get('Accept');
            if (accept === null) {
                return false;
            }
            const values = accept.split(',');
            return values.some(value => value.trim().toLowerCase() === 'text/html');
        }
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    const DEBUG_LOG_BUFFER_SIZE = 100;
    class DebugHandler {
        constructor(driver, adapter) {
            this.driver = driver;
            this.adapter = adapter;
            // There are two debug log message arrays. debugLogA records new debugging messages.
            // Once it reaches DEBUG_LOG_BUFFER_SIZE, the array is moved to debugLogB and a new
            // array is assigned to debugLogA. This ensures that insertion to the debug log is
            // always O(1) no matter the number of logged messages, and that the total number
            // of messages in the log never exceeds 2 * DEBUG_LOG_BUFFER_SIZE.
            this.debugLogA = [];
            this.debugLogB = [];
        }
        handleFetch(req) {
            return __awaiter(this, void 0, void 0, function* () {
                const [state, versions, idle] = yield Promise.all([
                    this.driver.debugState(),
                    this.driver.debugVersions(),
                    this.driver.debugIdleState(),
                ]);
                const msgState = `NGSW Debug Info:

Driver state: ${state.state} (${state.why})
Latest manifest hash: ${state.latestHash || 'none'}
Last update check: ${this.since(state.lastUpdateCheck)}`;
                const msgVersions = versions
                    .map(version => `=== Version ${version.hash} ===

Clients: ${version.clients.join(', ')}`)
                    .join('\n\n');
                const msgIdle = `=== Idle Task Queue ===
Last update tick: ${this.since(idle.lastTrigger)}
Last update run: ${this.since(idle.lastRun)}
Task queue:
${idle.queue.map(v => ' * ' + v).join('\n')}

Debug log:
${this.formatDebugLog(this.debugLogB)}
${this.formatDebugLog(this.debugLogA)}
`;
                return this.adapter.newResponse(`${msgState}

${msgVersions}

${msgIdle}`, { headers: this.adapter.newHeaders({ 'Content-Type': 'text/plain' }) });
            });
        }
        since(time) {
            if (time === null) {
                return 'never';
            }
            let age = this.adapter.time - time;
            const days = Math.floor(age / 86400000);
            age = age % 86400000;
            const hours = Math.floor(age / 3600000);
            age = age % 3600000;
            const minutes = Math.floor(age / 60000);
            age = age % 60000;
            const seconds = Math.floor(age / 1000);
            const millis = age % 1000;
            return '' + (days > 0 ? `${days}d` : '') + (hours > 0 ? `${hours}h` : '') +
                (minutes > 0 ? `${minutes}m` : '') + (seconds > 0 ? `${seconds}s` : '') +
                (millis > 0 ? `${millis}u` : '');
        }
        log(value, context = '') {
            // Rotate the buffers if debugLogA has grown too large.
            if (this.debugLogA.length === DEBUG_LOG_BUFFER_SIZE) {
                this.debugLogB = this.debugLogA;
                this.debugLogA = [];
            }
            // Convert errors to string for logging.
            if (typeof value !== 'string') {
                value = this.errorToString(value);
            }
            // Log the message.
            this.debugLogA.push({ value, time: this.adapter.time, context });
        }
        errorToString(err) {
            return `${err.name}(${err.message}, ${err.stack})`;
        }
        formatDebugLog(log) {
            return log.map(entry => `[${this.since(entry.time)}] ${entry.value} ${entry.context}`)
                .join('\n');
        }
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    class IdleScheduler {
        constructor(adapter, delay, maxDelay, debug) {
            this.adapter = adapter;
            this.delay = delay;
            this.maxDelay = maxDelay;
            this.debug = debug;
            this.queue = [];
            this.scheduled = null;
            this.empty = Promise.resolve();
            this.emptyResolve = null;
            this.lastTrigger = null;
            this.lastRun = null;
            this.oldestScheduledAt = null;
        }
        trigger() {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                this.lastTrigger = this.adapter.time;
                if (this.queue.length === 0) {
                    return;
                }
                if (this.scheduled !== null) {
                    this.scheduled.cancel = true;
                }
                const scheduled = {
                    cancel: false,
                };
                this.scheduled = scheduled;
                // Ensure that no task remains pending for longer than `this.maxDelay` ms.
                const now = this.adapter.time;
                const maxDelay = Math.max(0, ((_a = this.oldestScheduledAt) !== null && _a !== void 0 ? _a : now) + this.maxDelay - now);
                const delay = Math.min(maxDelay, this.delay);
                yield this.adapter.timeout(delay);
                if (scheduled.cancel) {
                    return;
                }
                this.scheduled = null;
                yield this.execute();
            });
        }
        execute() {
            return __awaiter(this, void 0, void 0, function* () {
                this.lastRun = this.adapter.time;
                while (this.queue.length > 0) {
                    const queue = this.queue;
                    this.queue = [];
                    yield queue.reduce((previous, task) => __awaiter(this, void 0, void 0, function* () {
                        yield previous;
                        try {
                            yield task.run();
                        }
                        catch (err) {
                            this.debug.log(err, `while running idle task ${task.desc}`);
                        }
                    }), Promise.resolve());
                }
                if (this.emptyResolve !== null) {
                    this.emptyResolve();
                    this.emptyResolve = null;
                }
                this.empty = Promise.resolve();
                this.oldestScheduledAt = null;
            });
        }
        schedule(desc, run) {
            this.queue.push({ desc, run });
            if (this.emptyResolve === null) {
                this.empty = new Promise(resolve => {
                    this.emptyResolve = resolve;
                });
            }
            if (this.oldestScheduledAt === null) {
                this.oldestScheduledAt = this.adapter.time;
            }
        }
        get size() {
            return this.queue.length;
        }
        get taskDescriptions() {
            return this.queue.map(task => task.desc);
        }
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function hashManifest(manifest) {
        return sha1(JSON.stringify(manifest));
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    function isMsgCheckForUpdates(msg) {
        return msg.action === 'CHECK_FOR_UPDATES';
    }
    function isMsgActivateUpdate(msg) {
        return msg.action === 'ACTIVATE_UPDATE';
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    const IDLE_DELAY = 5000;
    const MAX_IDLE_DELAY = 30000;
    const SUPPORTED_CONFIG_VERSION = 1;
    const NOTIFICATION_OPTION_NAMES = [
        'actions', 'badge', 'body', 'data', 'dir', 'icon', 'image', 'lang', 'renotify',
        'requireInteraction', 'silent', 'tag', 'timestamp', 'title', 'vibrate'
    ];
    var DriverReadyState = /*@__PURE__*/ (function (DriverReadyState) {
        // The SW is operating in a normal mode, responding to all traffic.
        DriverReadyState[DriverReadyState["NORMAL"] = 0] = "NORMAL";
        // The SW does not have a clean installation of the latest version of the app, but older
        // cached versions are safe to use so long as they don't try to fetch new dependencies.
        // This is a degraded state.
        DriverReadyState[DriverReadyState["EXISTING_CLIENTS_ONLY"] = 1] = "EXISTING_CLIENTS_ONLY";
        // The SW has decided that caching is completely unreliable, and is forgoing request
        // handling until the next restart.
        DriverReadyState[DriverReadyState["SAFE_MODE"] = 2] = "SAFE_MODE";
        return DriverReadyState;
    })({});
    class Driver {
        constructor(scope, adapter, db) {
            // Set up all the event handlers that the SW needs.
            this.scope = scope;
            this.adapter = adapter;
            this.db = db;
            /**
             * Tracks the current readiness condition under which the SW is operating. This controls
             * whether the SW attempts to respond to some or all requests.
             */
            this.state = DriverReadyState.NORMAL;
            this.stateMessage = '(nominal)';
            /**
             * Tracks whether the SW is in an initialized state or not. Before initialization,
             * it's not legal to respond to requests.
             */
            this.initialized = null;
            /**
             * Maps client IDs to the manifest hash of the application version being used to serve
             * them. If a client ID is not present here, it has not yet been assigned a version.
             *
             * If a ManifestHash appears here, it is also present in the `versions` map below.
             */
            this.clientVersionMap = new Map();
            /**
             * Maps manifest hashes to instances of `AppVersion` for those manifests.
             */
            this.versions = new Map();
            /**
             * The latest version fetched from the server.
             *
             * Valid after initialization has completed.
             */
            this.latestHash = null;
            this.lastUpdateCheck = null;
            /**
             * Whether there is a check for updates currently scheduled due to navigation.
             */
            this.scheduledNavUpdateCheck = false;
            /**
             * Keep track of whether we have logged an invalid `only-if-cached` request.
             * (See `.onFetch()` for details.)
             */
            this.loggedInvalidOnlyIfCachedRequest = false;
            this.ngswStatePath = this.adapter.parseUrl('ngsw/state', this.scope.registration.scope).path;
            // The install event is triggered when the service worker is first installed.
            this.scope.addEventListener('install', (event) => {
                // SW code updates are separate from application updates, so code updates are
                // almost as straightforward as restarting the SW. Because of this, it's always
                // safe to skip waiting until application tabs are closed, and activate the new
                // SW version immediately.
                event.waitUntil(this.scope.skipWaiting());
            });
            // The activate event is triggered when this version of the service worker is
            // first activated.
            this.scope.addEventListener('activate', (event) => {
                event.waitUntil((() => __awaiter(this, void 0, void 0, function* () {
                    // As above, it's safe to take over from existing clients immediately, since the new SW
                    // version will continue to serve the old application.
                    yield this.scope.clients.claim();
                    // Once all clients have been taken over, we can delete caches used by old versions of
                    // `@angular/service-worker`, which are no longer needed. This can happen in the background.
                    this.idle.schedule('activate: cleanup-old-sw-caches', () => __awaiter(this, void 0, void 0, function* () {
                        try {
                            yield this.cleanupOldSwCaches();
                        }
                        catch (err) {
                            // Nothing to do - cleanup failed. Just log it.
                            this.debugger.log(err, 'cleanupOldSwCaches @ activate: cleanup-old-sw-caches');
                        }
                    }));
                }))());
                // Rather than wait for the first fetch event, which may not arrive until
                // the next time the application is loaded, the SW takes advantage of the
                // activation event to schedule initialization. However, if this were run
                // in the context of the 'activate' event, waitUntil() here would cause fetch
                // events to block until initialization completed. Thus, the SW does a
                // postMessage() to itself, to schedule a new event loop iteration with an
                // entirely separate event context. The SW will be kept alive by waitUntil()
                // within that separate context while initialization proceeds, while at the
                // same time the activation event is allowed to resolve and traffic starts
                // being served.
                if (this.scope.registration.active !== null) {
                    this.scope.registration.active.postMessage({ action: 'INITIALIZE' });
                }
            });
            // Handle the fetch, message, and push events.
            this.scope.addEventListener('fetch', (event) => this.onFetch(event));
            this.scope.addEventListener('message', (event) => this.onMessage(event));
            this.scope.addEventListener('push', (event) => this.onPush(event));
            this.scope.addEventListener('notificationclick', (event) => this.onClick(event));
            // The debugger generates debug pages in response to debugging requests.
            this.debugger = new DebugHandler(this, this.adapter);
            // The IdleScheduler will execute idle tasks after a given delay.
            this.idle = new IdleScheduler(this.adapter, IDLE_DELAY, MAX_IDLE_DELAY, this.debugger);
        }
        /**
         * The handler for fetch events.
         *
         * This is the transition point between the synchronous event handler and the
         * asynchronous execution that eventually resolves for respondWith() and waitUntil().
         */
        onFetch(event) {
            const req = event.request;
            const scopeUrl = this.scope.registration.scope;
            const requestUrlObj = this.adapter.parseUrl(req.url, scopeUrl);
            if (req.headers.has('ngsw-bypass') || /[?&]ngsw-bypass(?:[=&]|$)/i.test(requestUrlObj.search)) {
                return;
            }
            // The only thing that is served unconditionally is the debug page.
            if (requestUrlObj.path === this.ngswStatePath) {
                // Allow the debugger to handle the request, but don't affect SW state in any other way.
                event.respondWith(this.debugger.handleFetch(req));
                return;
            }
            // If the SW is in a broken state where it's not safe to handle requests at all,
            // returning causes the request to fall back on the network. This is preferred over
            // `respondWith(fetch(req))` because the latter still shows in DevTools that the
            // request was handled by the SW.
            if (this.state === DriverReadyState.SAFE_MODE) {
                // Even though the worker is in safe mode, idle tasks still need to happen so
                // things like update checks, etc. can take place.
                event.waitUntil(this.idle.trigger());
                return;
            }
            // Although "passive mixed content" (like images) only produces a warning without a
            // ServiceWorker, fetching it via a ServiceWorker results in an error. Let such requests be
            // handled by the browser, since handling with the ServiceWorker would fail anyway.
            // See https://github.com/angular/angular/issues/23012#issuecomment-376430187 for more details.
            if (requestUrlObj.origin.startsWith('http:') && scopeUrl.startsWith('https:')) {
                // Still, log the incident for debugging purposes.
                this.debugger.log(`Ignoring passive mixed content request: Driver.fetch(${req.url})`);
                return;
            }
            // When opening DevTools in Chrome, a request is made for the current URL (and possibly related
            // resources, e.g. scripts) with `cache: 'only-if-cached'` and `mode: 'no-cors'`. These request
            // will eventually fail, because `only-if-cached` is only allowed to be used with
            // `mode: 'same-origin'`.
            // This is likely a bug in Chrome DevTools. Avoid handling such requests.
            // (See also https://github.com/angular/angular/issues/22362.)
            // TODO(gkalpak): Remove once no longer necessary (i.e. fixed in Chrome DevTools).
            if (req.cache === 'only-if-cached' && req.mode !== 'same-origin') {
                // Log the incident only the first time it happens, to avoid spamming the logs.
                if (!this.loggedInvalidOnlyIfCachedRequest) {
                    this.loggedInvalidOnlyIfCachedRequest = true;
                    this.debugger.log(`Ignoring invalid request: 'only-if-cached' can be set only with 'same-origin' mode`, `Driver.fetch(${req.url}, cache: ${req.cache}, mode: ${req.mode})`);
                }
                return;
            }
            // Past this point, the SW commits to handling the request itself. This could still
            // fail (and result in `state` being set to `SAFE_MODE`), but even in that case the
            // SW will still deliver a response.
            event.respondWith(this.handleFetch(event));
        }
        /**
         * The handler for message events.
         */
        onMessage(event) {
            // Ignore message events when the SW is in safe mode, for now.
            if (this.state === DriverReadyState.SAFE_MODE) {
                return;
            }
            // If the message doesn't have the expected signature, ignore it.
            const data = event.data;
            if (!data || !data.action) {
                return;
            }
            event.waitUntil((() => __awaiter(this, void 0, void 0, function* () {
                // Initialization is the only event which is sent directly from the SW to itself, and thus
                // `event.source` is not a `Client`. Handle it here, before the check for `Client` sources.
                if (data.action === 'INITIALIZE') {
                    return this.ensureInitialized(event);
                }
                // Only messages from true clients are accepted past this point.
                // This is essentially a typecast.
                if (!this.adapter.isClient(event.source)) {
                    return;
                }
                // Handle the message and keep the SW alive until it's handled.
                yield this.ensureInitialized(event);
                yield this.handleMessage(data, event.source);
            }))());
        }
        onPush(msg) {
            // Push notifications without data have no effect.
            if (!msg.data) {
                return;
            }
            // Handle the push and keep the SW alive until it's handled.
            msg.waitUntil(this.handlePush(msg.data.json()));
        }
        onClick(event) {
            // Handle the click event and keep the SW alive until it's handled.
            event.waitUntil(this.handleClick(event.notification, event.action));
        }
        ensureInitialized(event) {
            return __awaiter(this, void 0, void 0, function* () {
                // Since the SW may have just been started, it may or may not have been initialized already.
                // `this.initialized` will be `null` if initialization has not yet been attempted, or will be a
                // `Promise` which will resolve (successfully or unsuccessfully) if it has.
                if (this.initialized !== null) {
                    return this.initialized;
                }
                // Initialization has not yet been attempted, so attempt it. This should only ever happen once
                // per SW instantiation.
                try {
                    this.initialized = this.initialize();
                    yield this.initialized;
                }
                catch (error) {
                    // If initialization fails, the SW needs to enter a safe state, where it declines to respond
                    // to network requests.
                    this.state = DriverReadyState.SAFE_MODE;
                    this.stateMessage = `Initialization failed due to error: ${errorToString(error)}`;
                    throw error;
                }
                finally {
                    // Regardless if initialization succeeded, background tasks still need to happen.
                    event.waitUntil(this.idle.trigger());
                }
            });
        }
        handleMessage(msg, from) {
            return __awaiter(this, void 0, void 0, function* () {
                if (isMsgCheckForUpdates(msg)) {
                    const action = (() => __awaiter(this, void 0, void 0, function* () {
                        yield this.checkForUpdate();
                    }))();
                    yield this.reportStatus(from, action, msg.statusNonce);
                }
                else if (isMsgActivateUpdate(msg)) {
                    yield this.reportStatus(from, this.updateClient(from), msg.statusNonce);
                }
            });
        }
        handlePush(data) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.broadcast({
                    type: 'PUSH',
                    data,
                });
                if (!data.notification || !data.notification.title) {
                    return;
                }
                const desc = data.notification;
                let options = {};
                NOTIFICATION_OPTION_NAMES.filter(name => desc.hasOwnProperty(name))
                    .forEach(name => options[name] = desc[name]);
                yield this.scope.registration.showNotification(desc['title'], options);
            });
        }
        handleClick(notification, action) {
            return __awaiter(this, void 0, void 0, function* () {
                notification.close();
                const options = {};
                // The filter uses `name in notification` because the properties are on the prototype so
                // hasOwnProperty does not work here
                NOTIFICATION_OPTION_NAMES.filter(name => name in notification)
                    .forEach(name => options[name] = notification[name]);
                yield this.broadcast({
                    type: 'NOTIFICATION_CLICK',
                    data: { action, notification: options },
                });
            });
        }
        reportStatus(client, promise, nonce) {
            return __awaiter(this, void 0, void 0, function* () {
                const response = { type: 'STATUS', nonce, status: true };
                try {
                    yield promise;
                    client.postMessage(response);
                }
                catch (e) {
                    client.postMessage(Object.assign(Object.assign({}, response), { status: false, error: e.toString() }));
                }
            });
        }
        updateClient(client) {
            return __awaiter(this, void 0, void 0, function* () {
                // Figure out which version the client is on. If it's not on the latest,
                // it needs to be moved.
                const existing = this.clientVersionMap.get(client.id);
                if (existing === this.latestHash) {
                    // Nothing to do, this client is already on the latest version.
                    return;
                }
                // Switch the client over.
                let previous = undefined;
                // Look up the application data associated with the existing version. If there
                // isn't any, fall back on using the hash.
                if (existing !== undefined) {
                    const existingVersion = this.versions.get(existing);
                    previous = this.mergeHashWithAppData(existingVersion.manifest, existing);
                }
                // Set the current version used by the client, and sync the mapping to disk.
                this.clientVersionMap.set(client.id, this.latestHash);
                yield this.sync();
                // Notify the client about this activation.
                const current = this.versions.get(this.latestHash);
                const notice = {
                    type: 'UPDATE_ACTIVATED',
                    previous,
                    current: this.mergeHashWithAppData(current.manifest, this.latestHash),
                };
                client.postMessage(notice);
            });
        }
        handleFetch(event) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    // Ensure the SW instance has been initialized.
                    yield this.ensureInitialized(event);
                }
                catch (_a) {
                    // Since the SW is already committed to responding to the currently active request,
                    // respond with a network fetch.
                    return this.safeFetch(event.request);
                }
                // On navigation requests, check for new updates.
                if (event.request.mode === 'navigate' && !this.scheduledNavUpdateCheck) {
                    this.scheduledNavUpdateCheck = true;
                    this.idle.schedule('check-updates-on-navigation', () => __awaiter(this, void 0, void 0, function* () {
                        this.scheduledNavUpdateCheck = false;
                        yield this.checkForUpdate();
                    }));
                }
                // Decide which version of the app to use to serve this request. This is asynchronous as in
                // some cases, a record will need to be written to disk about the assignment that is made.
                const appVersion = yield this.assignVersion(event);
                let res = null;
                try {
                    if (appVersion !== null) {
                        try {
                            // Handle the request. First try the AppVersion. If that doesn't work, fall back on the
                            // network.
                            res = yield appVersion.handleFetch(event.request, event);
                        }
                        catch (err) {
                            if (err.isUnrecoverableState) {
                                yield this.notifyClientsAboutUnrecoverableState(appVersion, err.message);
                            }
                            if (err.isCritical) {
                                // Something went wrong with the activation of this version.
                                yield this.versionFailed(appVersion, err);
                                return this.safeFetch(event.request);
                            }
                            throw err;
                        }
                    }
                    // The response will be `null` only if no `AppVersion` can be assigned to the request or if
                    // the assigned `AppVersion`'s manifest doesn't specify what to do about the request.
                    // In that case, just fall back on the network.
                    if (res === null) {
                        return this.safeFetch(event.request);
                    }
                    // The `AppVersion` returned a usable response, so return it.
                    return res;
                }
                finally {
                    // Trigger the idle scheduling system. The Promise returned by `trigger()` will resolve after
                    // a specific amount of time has passed. If `trigger()` hasn't been called again by then (e.g.
                    // on a subsequent request), the idle task queue will be drained and the `Promise` won't
                    // be resolved until that operation is complete as well.
                    event.waitUntil(this.idle.trigger());
                }
            });
        }
        /**
         * Attempt to quickly reach a state where it's safe to serve responses.
         */
        initialize() {
            return __awaiter(this, void 0, void 0, function* () {
                // On initialization, all of the serialized state is read out of the 'control'
                // table. This includes:
                // - map of hashes to manifests of currently loaded application versions
                // - map of client IDs to their pinned versions
                // - record of the most recently fetched manifest hash
                //
                // If these values don't exist in the DB, then this is the either the first time
                // the SW has run or the DB state has been wiped or is inconsistent. In that case,
                // load a fresh copy of the manifest and reset the state from scratch.
                // Open up the DB table.
                const table = yield this.db.open('control');
                // Attempt to load the needed state from the DB. If this fails, the catch {} block
                // will populate these variables with freshly constructed values.
                let manifests, assignments, latest;
                try {
                    // Read them from the DB simultaneously.
                    [manifests, assignments, latest] = yield Promise.all([
                        table.read('manifests'),
                        table.read('assignments'),
                        table.read('latest'),
                    ]);
                    // Make sure latest manifest is correctly installed. If not (e.g. corrupted data),
                    // it could stay locked in EXISTING_CLIENTS_ONLY or SAFE_MODE state.
                    if (!this.versions.has(latest.latest) && !manifests.hasOwnProperty(latest.latest)) {
                        this.debugger.log(`Missing manifest for latest version hash ${latest.latest}`, 'initialize: read from DB');
                        throw new Error(`Missing manifest for latest hash ${latest.latest}`);
                    }
                    // Successfully loaded from saved state. This implies a manifest exists, so
                    // the update check needs to happen in the background.
                    this.idle.schedule('init post-load (update, cleanup)', () => __awaiter(this, void 0, void 0, function* () {
                        yield this.checkForUpdate();
                        try {
                            yield this.cleanupCaches();
                        }
                        catch (err) {
                            // Nothing to do - cleanup failed. Just log it.
                            this.debugger.log(err, 'cleanupCaches @ init post-load');
                        }
                    }));
                }
                catch (_) {
                    // Something went wrong. Try to start over by fetching a new manifest from the
                    // server and building up an empty initial state.
                    const manifest = yield this.fetchLatestManifest();
                    const hash = hashManifest(manifest);
                    manifests = {};
                    manifests[hash] = manifest;
                    assignments = {};
                    latest = { latest: hash };
                    // Save the initial state to the DB.
                    yield Promise.all([
                        table.write('manifests', manifests),
                        table.write('assignments', assignments),
                        table.write('latest', latest),
                    ]);
                }
                // At this point, either the state has been loaded successfully, or fresh state
                // with a new copy of the manifest has been produced. At this point, the `Driver`
                // can have its internals hydrated from the state.
                // Initialize the `versions` map by setting each hash to a new `AppVersion` instance
                // for that manifest.
                Object.keys(manifests).forEach((hash) => {
                    const manifest = manifests[hash];
                    // If the manifest is newly initialized, an AppVersion may have already been
                    // created for it.
                    if (!this.versions.has(hash)) {
                        this.versions.set(hash, new AppVersion(this.scope, this.adapter, this.db, this.idle, this.debugger, manifest, hash));
                    }
                });
                // Map each client ID to its associated hash. Along the way, verify that the hash
                // is still valid for that client ID. It should not be possible for a client to
                // still be associated with a hash that was since removed from the state.
                Object.keys(assignments).forEach((clientId) => {
                    const hash = assignments[clientId];
                    if (this.versions.has(hash)) {
                        this.clientVersionMap.set(clientId, hash);
                    }
                    else {
                        this.clientVersionMap.set(clientId, latest.latest);
                        this.debugger.log(`Unknown version ${hash} mapped for client ${clientId}, using latest instead`, `initialize: map assignments`);
                    }
                });
                // Set the latest version.
                this.latestHash = latest.latest;
                // Finally, assert that the latest version is in fact loaded.
                if (!this.versions.has(latest.latest)) {
                    throw new Error(`Invariant violated (initialize): latest hash ${latest.latest} has no known manifest`);
                }
                // Finally, wait for the scheduling of initialization of all versions in the
                // manifest. Ordinarily this just schedules the initializations to happen during
                // the next idle period, but in development mode this might actually wait for the
                // full initialization.
                // If any of these initializations fail, versionFailed() will be called either
                // synchronously or asynchronously to handle the failure and re-map clients.
                yield Promise.all(Object.keys(manifests).map((hash) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        // Attempt to schedule or initialize this version. If this operation is
                        // successful, then initialization either succeeded or was scheduled. If
                        // it fails, then full initialization was attempted and failed.
                        yield this.scheduleInitialization(this.versions.get(hash));
                    }
                    catch (err) {
                        this.debugger.log(err, `initialize: schedule init of ${hash}`);
                        return false;
                    }
                })));
            });
        }
        lookupVersionByHash(hash, debugName = 'lookupVersionByHash') {
            // The version should exist, but check just in case.
            if (!this.versions.has(hash)) {
                throw new Error(`Invariant violated (${debugName}): want AppVersion for ${hash} but not loaded`);
            }
            return this.versions.get(hash);
        }
        /**
         * Decide which version of the manifest to use for the event.
         */
        assignVersion(event) {
            return __awaiter(this, void 0, void 0, function* () {
                // First, check whether the event has a (non empty) client ID. If it does, the version may
                // already be associated.
                const clientId = event.clientId;
                if (clientId) {
                    // Check if there is an assigned client id.
                    if (this.clientVersionMap.has(clientId)) {
                        // There is an assignment for this client already.
                        const hash = this.clientVersionMap.get(clientId);
                        let appVersion = this.lookupVersionByHash(hash, 'assignVersion');
                        // Ordinarily, this client would be served from its assigned version. But, if this
                        // request is a navigation request, this client can be updated to the latest
                        // version immediately.
                        if (this.state === DriverReadyState.NORMAL && hash !== this.latestHash &&
                            appVersion.isNavigationRequest(event.request)) {
                            // Update this client to the latest version immediately.
                            if (this.latestHash === null) {
                                throw new Error(`Invariant violated (assignVersion): latestHash was null`);
                            }
                            const client = yield this.scope.clients.get(clientId);
                            yield this.updateClient(client);
                            appVersion = this.lookupVersionByHash(this.latestHash, 'assignVersion');
                        }
                        // TODO: make sure the version is valid.
                        return appVersion;
                    }
                    else {
                        // This is the first time this client ID has been seen. Whether the SW is in a
                        // state to handle new clients depends on the current readiness state, so check
                        // that first.
                        if (this.state !== DriverReadyState.NORMAL) {
                            // It's not safe to serve new clients in the current state. It's possible that
                            // this is an existing client which has not been mapped yet (see below) but
                            // even if that is the case, it's invalid to make an assignment to a known
                            // invalid version, even if that assignment was previously implicit. Return
                            // undefined here to let the caller know that no assignment is possible at
                            // this time.
                            return null;
                        }
                        // It's safe to handle this request. Two cases apply. Either:
                        // 1) the browser assigned a client ID at the time of the navigation request, and
                        //    this is truly the first time seeing this client, or
                        // 2) a navigation request came previously from the same client, but with no client
                        //    ID attached. Browsers do this to avoid creating a client under the origin in
                        //    the event the navigation request is just redirected.
                        //
                        // In case 1, the latest version can safely be used.
                        // In case 2, the latest version can be used, with the assumption that the previous
                        // navigation request was answered under the same version. This assumption relies
                        // on the fact that it's unlikely an update will come in between the navigation
                        // request and requests for subsequent resources on that page.
                        // First validate the current state.
                        if (this.latestHash === null) {
                            throw new Error(`Invariant violated (assignVersion): latestHash was null`);
                        }
                        // Pin this client ID to the current latest version, indefinitely.
                        this.clientVersionMap.set(clientId, this.latestHash);
                        yield this.sync();
                        // Return the latest `AppVersion`.
                        return this.lookupVersionByHash(this.latestHash, 'assignVersion');
                    }
                }
                else {
                    // No client ID was associated with the request. This must be a navigation request
                    // for a new client. First check that the SW is accepting new clients.
                    if (this.state !== DriverReadyState.NORMAL) {
                        return null;
                    }
                    // Serve it with the latest version, and assume that the client will actually get
                    // associated with that version on the next request.
                    // First validate the current state.
                    if (this.latestHash === null) {
                        throw new Error(`Invariant violated (assignVersion): latestHash was null`);
                    }
                    // Return the latest `AppVersion`.
                    return this.lookupVersionByHash(this.latestHash, 'assignVersion');
                }
            });
        }
        fetchLatestManifest(ignoreOfflineError = false) {
            return __awaiter(this, void 0, void 0, function* () {
                const res = yield this.safeFetch(this.adapter.newRequest('ngsw.json?ngsw-cache-bust=' + Math.random()));
                if (!res.ok) {
                    if (res.status === 404) {
                        yield this.deleteAllCaches();
                        yield this.scope.registration.unregister();
                    }
                    else if ((res.status === 503 || res.status === 504) && ignoreOfflineError) {
                        return null;
                    }
                    throw new Error(`Manifest fetch failed! (status: ${res.status})`);
                }
                this.lastUpdateCheck = this.adapter.time;
                return res.json();
            });
        }
        deleteAllCaches() {
            return __awaiter(this, void 0, void 0, function* () {
                const cacheNames = yield this.scope.caches.keys();
                const ownCacheNames = cacheNames.filter(name => name.startsWith(`${this.adapter.cacheNamePrefix}:`));
                yield Promise.all(ownCacheNames.map(name => this.scope.caches.delete(name)));
            });
        }
        /**
         * Schedule the SW's attempt to reach a fully prefetched state for the given AppVersion
         * when the SW is not busy and has connectivity. This returns a Promise which must be
         * awaited, as under some conditions the AppVersion might be initialized immediately.
         */
        scheduleInitialization(appVersion) {
            return __awaiter(this, void 0, void 0, function* () {
                const initialize = () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield appVersion.initializeFully();
                    }
                    catch (err) {
                        this.debugger.log(err, `initializeFully for ${appVersion.manifestHash}`);
                        yield this.versionFailed(appVersion, err);
                    }
                });
                // TODO: better logic for detecting localhost.
                if (this.scope.registration.scope.indexOf('://localhost') > -1) {
                    return initialize();
                }
                this.idle.schedule(`initialization(${appVersion.manifestHash})`, initialize);
            });
        }
        versionFailed(appVersion, err) {
            return __awaiter(this, void 0, void 0, function* () {
                // This particular AppVersion is broken. First, find the manifest hash.
                const broken = Array.from(this.versions.entries()).find(([hash, version]) => version === appVersion);
                if (broken === undefined) {
                    // This version is no longer in use anyway, so nobody cares.
                    return;
                }
                const brokenHash = broken[0];
                const affectedClients = Array.from(this.clientVersionMap.entries())
                    .filter(([clientId, hash]) => hash === brokenHash)
                    .map(([clientId]) => clientId);
                // TODO: notify affected apps.
                // The action taken depends on whether the broken manifest is the active (latest) or not.
                // If so, the SW cannot accept new clients, but can continue to service old ones.
                if (this.latestHash === brokenHash) {
                    // The latest manifest is broken. This means that new clients are at the mercy of the
                    // network, but caches continue to be valid for previous versions. This is
                    // unfortunate but unavoidable.
                    this.state = DriverReadyState.EXISTING_CLIENTS_ONLY;
                    this.stateMessage = `Degraded due to: ${errorToString(err)}`;
                    // Cancel the binding for the affected clients.
                    affectedClients.forEach(clientId => this.clientVersionMap.delete(clientId));
                }
                else {
                    // The latest version is viable, but this older version isn't. The only
                    // possible remedy is to stop serving the older version and go to the network.
                    // Put the affected clients on the latest version.
                    affectedClients.forEach(clientId => this.clientVersionMap.set(clientId, this.latestHash));
                }
                try {
                    yield this.sync();
                }
                catch (err2) {
                    // We are already in a bad state. No need to make things worse.
                    // Just log the error and move on.
                    this.debugger.log(err2, `Driver.versionFailed(${err.message || err})`);
                }
            });
        }
        setupUpdate(manifest, hash) {
            return __awaiter(this, void 0, void 0, function* () {
                const newVersion = new AppVersion(this.scope, this.adapter, this.db, this.idle, this.debugger, manifest, hash);
                // Firstly, check if the manifest version is correct.
                if (manifest.configVersion !== SUPPORTED_CONFIG_VERSION) {
                    yield this.deleteAllCaches();
                    yield this.scope.registration.unregister();
                    throw new Error(`Invalid config version: expected ${SUPPORTED_CONFIG_VERSION}, got ${manifest.configVersion}.`);
                }
                // Cause the new version to become fully initialized. If this fails, then the
                // version will not be available for use.
                yield newVersion.initializeFully(this);
                // Install this as an active version of the app.
                this.versions.set(hash, newVersion);
                // Future new clients will use this hash as the latest version.
                this.latestHash = hash;
                // If we are in `EXISTING_CLIENTS_ONLY` mode (meaning we didn't have a clean copy of the last
                // latest version), we can now recover to `NORMAL` mode and start accepting new clients.
                if (this.state === DriverReadyState.EXISTING_CLIENTS_ONLY) {
                    this.state = DriverReadyState.NORMAL;
                    this.stateMessage = '(nominal)';
                }
                yield this.sync();
                yield this.notifyClientsAboutUpdate(newVersion);
            });
        }
        checkForUpdate() {
            return __awaiter(this, void 0, void 0, function* () {
                let hash = '(unknown)';
                try {
                    const manifest = yield this.fetchLatestManifest(true);
                    if (manifest === null) {
                        // Client or server offline. Unable to check for updates at this time.
                        // Continue to service clients (existing and new).
                        this.debugger.log('Check for update aborted. (Client or server offline.)');
                        return false;
                    }
                    hash = hashManifest(manifest);
                    // Check whether this is really an update.
                    if (this.versions.has(hash)) {
                        return false;
                    }
                    yield this.setupUpdate(manifest, hash);
                    return true;
                }
                catch (err) {
                    this.debugger.log(err, `Error occurred while updating to manifest ${hash}`);
                    this.state = DriverReadyState.EXISTING_CLIENTS_ONLY;
                    this.stateMessage = `Degraded due to failed initialization: ${errorToString(err)}`;
                    return false;
                }
            });
        }
        /**
         * Synchronize the existing state to the underlying database.
         */
        sync() {
            return __awaiter(this, void 0, void 0, function* () {
                // Open up the DB table.
                const table = yield this.db.open('control');
                // Construct a serializable map of hashes to manifests.
                const manifests = {};
                this.versions.forEach((version, hash) => {
                    manifests[hash] = version.manifest;
                });
                // Construct a serializable map of client ids to version hashes.
                const assignments = {};
                this.clientVersionMap.forEach((hash, clientId) => {
                    assignments[clientId] = hash;
                });
                // Record the latest entry. Since this is a sync which is necessarily happening after
                // initialization, latestHash should always be valid.
                const latest = {
                    latest: this.latestHash,
                };
                // Synchronize all of these.
                yield Promise.all([
                    table.write('manifests', manifests),
                    table.write('assignments', assignments),
                    table.write('latest', latest),
                ]);
            });
        }
        cleanupCaches() {
            return __awaiter(this, void 0, void 0, function* () {
                // Query for all currently active clients, and list the client ids. This may skip
                // some clients in the browser back-forward cache, but not much can be done about
                // that.
                const activeClients = (yield this.scope.clients.matchAll()).map(client => client.id);
                // A simple list of client ids that the SW has kept track of. Subtracting
                // activeClients from this list will result in the set of client ids which are
                // being tracked but are no longer used in the browser, and thus can be cleaned up.
                const knownClients = Array.from(this.clientVersionMap.keys());
                // Remove clients in the clientVersionMap that are no longer active.
                knownClients.filter(id => activeClients.indexOf(id) === -1)
                    .forEach(id => this.clientVersionMap.delete(id));
                // Next, determine the set of versions which are still used. All others can be
                // removed.
                const usedVersions = new Set();
                this.clientVersionMap.forEach((version, _) => usedVersions.add(version));
                // Collect all obsolete versions by filtering out used versions from the set of all versions.
                const obsoleteVersions = Array.from(this.versions.keys())
                    .filter(version => !usedVersions.has(version) && version !== this.latestHash);
                // Remove all the versions which are no longer used.
                yield obsoleteVersions.reduce((previous, version) => __awaiter(this, void 0, void 0, function* () {
                    // Wait for the other cleanup operations to complete.
                    yield previous;
                    // Try to get past the failure of one particular version to clean up (this
                    // shouldn't happen, but handle it just in case).
                    try {
                        // Get ahold of the AppVersion for this particular hash.
                        const instance = this.versions.get(version);
                        // Delete it from the canonical map.
                        this.versions.delete(version);
                        // Clean it up.
                        yield instance.cleanup();
                    }
                    catch (err) {
                        // Oh well? Not much that can be done here. These caches will be removed when
                        // the SW revs its format version, which happens from time to time.
                        this.debugger.log(err, `cleanupCaches - cleanup ${version}`);
                    }
                }), Promise.resolve());
                // Commit all the changes to the saved state.
                yield this.sync();
            });
        }
        /**
         * Delete caches that were used by older versions of `@angular/service-worker` to avoid running
         * into storage quota limitations imposed by browsers.
         * (Since at this point the SW has claimed all clients, it is safe to remove those caches.)
         */
        cleanupOldSwCaches() {
            return __awaiter(this, void 0, void 0, function* () {
                const cacheNames = yield this.scope.caches.keys();
                const oldSwCacheNames = cacheNames.filter(name => /^ngsw:(?!\/)/.test(name));
                yield Promise.all(oldSwCacheNames.map(name => this.scope.caches.delete(name)));
            });
        }
        /**
         * Determine if a specific version of the given resource is cached anywhere within the SW,
         * and fetch it if so.
         */
        lookupResourceWithHash(url, hash) {
            return Array
                // Scan through the set of all cached versions, valid or otherwise. It's safe to do such
                // lookups even for invalid versions as the cached version of a resource will have the
                // same hash regardless.
                .from(this.versions.values())
                // Reduce the set of versions to a single potential result. At any point along the
                // reduction, if a response has already been identified, then pass it through, as no
                // future operation could change the response. If no response has been found yet, keep
                // checking versions until one is or until all versions have been exhausted.
                .reduce((prev, version) => __awaiter(this, void 0, void 0, function* () {
                // First, check the previous result. If a non-null result has been found already, just
                // return it.
                if ((yield prev) !== null) {
                    return prev;
                }
                // No result has been found yet. Try the next `AppVersion`.
                return version.lookupResourceWithHash(url, hash);
            }), Promise.resolve(null));
        }
        lookupResourceWithoutHash(url) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.initialized;
                const version = this.versions.get(this.latestHash);
                return version ? version.lookupResourceWithoutHash(url) : null;
            });
        }
        previouslyCachedResources() {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.initialized;
                const version = this.versions.get(this.latestHash);
                return version ? version.previouslyCachedResources() : [];
            });
        }
        recentCacheStatus(url) {
            return __awaiter(this, void 0, void 0, function* () {
                const version = this.versions.get(this.latestHash);
                return version ? version.recentCacheStatus(url) : UpdateCacheStatus.NOT_CACHED;
            });
        }
        mergeHashWithAppData(manifest, hash) {
            return {
                hash,
                appData: manifest.appData,
            };
        }
        notifyClientsAboutUnrecoverableState(appVersion, reason) {
            return __awaiter(this, void 0, void 0, function* () {
                const broken = Array.from(this.versions.entries()).find(([hash, version]) => version === appVersion);
                if (broken === undefined) {
                    // This version is no longer in use anyway, so nobody cares.
                    return;
                }
                const brokenHash = broken[0];
                const affectedClients = Array.from(this.clientVersionMap.entries())
                    .filter(([clientId, hash]) => hash === brokenHash)
                    .map(([clientId]) => clientId);
                yield Promise.all(affectedClients.map((clientId) => __awaiter(this, void 0, void 0, function* () {
                    const client = yield this.scope.clients.get(clientId);
                    client.postMessage({ type: 'UNRECOVERABLE_STATE', reason });
                })));
            });
        }
        notifyClientsAboutUpdate(next) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.initialized;
                const clients = yield this.scope.clients.matchAll();
                yield Promise.all(clients.map((client) => __awaiter(this, void 0, void 0, function* () {
                    // Firstly, determine which version this client is on.
                    const version = this.clientVersionMap.get(client.id);
                    if (version === undefined) {
                        // Unmapped client - assume it's the latest.
                        return;
                    }
                    if (version === this.latestHash) {
                        // Client is already on the latest version, no need for a notification.
                        return;
                    }
                    const current = this.versions.get(version);
                    // Send a notice.
                    const notice = {
                        type: 'UPDATE_AVAILABLE',
                        current: this.mergeHashWithAppData(current.manifest, version),
                        available: this.mergeHashWithAppData(next.manifest, this.latestHash),
                    };
                    client.postMessage(notice);
                })));
            });
        }
        broadcast(msg) {
            return __awaiter(this, void 0, void 0, function* () {
                const clients = yield this.scope.clients.matchAll();
                clients.forEach(client => {
                    client.postMessage(msg);
                });
            });
        }
        debugState() {
            return __awaiter(this, void 0, void 0, function* () {
                return {
                    state: DriverReadyState[this.state],
                    why: this.stateMessage,
                    latestHash: this.latestHash,
                    lastUpdateCheck: this.lastUpdateCheck,
                };
            });
        }
        debugVersions() {
            return __awaiter(this, void 0, void 0, function* () {
                // Build list of versions.
                return Array.from(this.versions.keys()).map(hash => {
                    const version = this.versions.get(hash);
                    const clients = Array.from(this.clientVersionMap.entries())
                        .filter(([clientId, version]) => version === hash)
                        .map(([clientId, version]) => clientId);
                    return {
                        hash,
                        manifest: version.manifest,
                        clients,
                        status: '',
                    };
                });
            });
        }
        debugIdleState() {
            return __awaiter(this, void 0, void 0, function* () {
                return {
                    queue: this.idle.taskDescriptions,
                    lastTrigger: this.idle.lastTrigger,
                    lastRun: this.idle.lastRun,
                };
            });
        }
        safeFetch(req) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    return yield this.scope.fetch(req);
                }
                catch (err) {
                    this.debugger.log(err, `Driver.fetch(${req.url})`);
                    return this.adapter.newResponse(null, {
                        status: 504,
                        statusText: 'Gateway Timeout',
                    });
                }
            });
        }
    }

    /**
     * @license
     * Copyright Google LLC All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    const scope = self;
    const adapter = new Adapter(scope.registration.scope);
    const driver = new Driver(scope, adapter, new CacheDatabase(scope, adapter));

}());
