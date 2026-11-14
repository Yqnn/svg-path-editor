(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // packages/service-worker/worker/src/named-cache-storage.js
  var NamedCacheStorage = class {
    constructor(original, cacheNamePrefix) {
      __publicField(this, "original");
      __publicField(this, "cacheNamePrefix");
      this.original = original;
      this.cacheNamePrefix = cacheNamePrefix;
    }
    delete(cacheName) {
      return this.original.delete(`${this.cacheNamePrefix}:${cacheName}`);
    }
    has(cacheName) {
      return this.original.has(`${this.cacheNamePrefix}:${cacheName}`);
    }
    async keys() {
      const prefix = `${this.cacheNamePrefix}:`;
      const allCacheNames = await this.original.keys();
      const ownCacheNames = allCacheNames.filter((name) => name.startsWith(prefix));
      return ownCacheNames.map((name) => name.slice(prefix.length));
    }
    match(request, options) {
      return this.original.match(request, options);
    }
    async open(cacheName) {
      const cache = await this.original.open(`${this.cacheNamePrefix}:${cacheName}`);
      return Object.assign(cache, { name: cacheName });
    }
  };

  // packages/service-worker/worker/src/adapter.js
  var Adapter = class {
    constructor(scopeUrl, caches) {
      __publicField(this, "scopeUrl");
      __publicField(this, "caches");
      __publicField(this, "origin");
      this.scopeUrl = scopeUrl;
      const parsedScopeUrl = this.parseUrl(this.scopeUrl);
      this.origin = parsedScopeUrl.origin;
      this.caches = new NamedCacheStorage(caches, `ngsw:${parsedScopeUrl.path}`);
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
      return source instanceof Client;
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
      const parsed = this.parseUrl(url, this.scopeUrl);
      return parsed.origin === this.origin ? parsed.path : url;
    }
    /**
     * Parse a URL into its different parts, such as `origin`, `path` and `search`.
     */
    parseUrl(url, relativeTo) {
      const parsed = !relativeTo ? new URL(url) : new URL(url, relativeTo);
      return { origin: parsed.origin, path: parsed.pathname, search: parsed.search };
    }
    /**
     * Wait for a given amount of time before completing a Promise.
     */
    timeout(ms) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(), ms);
      });
    }
  };

  // packages/service-worker/worker/src/database.js
  var NotFound = class {
    constructor(table, key) {
      __publicField(this, "table");
      __publicField(this, "key");
      this.table = table;
      this.key = key;
    }
  };

  // packages/service-worker/worker/src/db-cache.js
  var CacheDatabase = class {
    constructor(adapter2) {
      __publicField(this, "adapter");
      __publicField(this, "cacheNamePrefix", "db");
      __publicField(this, "tables", /* @__PURE__ */ new Map());
      this.adapter = adapter2;
    }
    "delete"(name) {
      if (this.tables.has(name)) {
        this.tables.delete(name);
      }
      return this.adapter.caches.delete(`${this.cacheNamePrefix}:${name}`);
    }
    async list() {
      const prefix = `${this.cacheNamePrefix}:`;
      const allCacheNames = await this.adapter.caches.keys();
      const dbCacheNames = allCacheNames.filter((name) => name.startsWith(prefix));
      return dbCacheNames.map((name) => name.slice(prefix.length));
    }
    async open(name, cacheQueryOptions) {
      if (!this.tables.has(name)) {
        const cache = await this.adapter.caches.open(`${this.cacheNamePrefix}:${name}`);
        const table = new CacheTable(name, cache, this.adapter, cacheQueryOptions);
        this.tables.set(name, table);
      }
      return this.tables.get(name);
    }
  };
  var CacheTable = class {
    constructor(name, cache, adapter2, cacheQueryOptions) {
      __publicField(this, "name");
      __publicField(this, "cache");
      __publicField(this, "adapter");
      __publicField(this, "cacheQueryOptions");
      __publicField(this, "cacheName");
      this.name = name;
      this.cache = cache;
      this.adapter = adapter2;
      this.cacheQueryOptions = cacheQueryOptions;
      this.cacheName = this.cache.name;
    }
    request(key) {
      return this.adapter.newRequest("/" + key);
    }
    "delete"(key) {
      return this.cache.delete(this.request(key), this.cacheQueryOptions);
    }
    keys() {
      return this.cache.keys().then((requests) => requests.map((req) => req.url.slice(1)));
    }
    read(key) {
      return this.cache.match(this.request(key), this.cacheQueryOptions).then((res) => {
        if (res === void 0) {
          return Promise.reject(new NotFound(this.name, key));
        }
        return res.json();
      });
    }
    write(key, value) {
      return this.cache.put(this.request(key), this.adapter.newResponse(JSON.stringify(value)));
    }
  };

  // packages/service-worker/worker/src/api.js
  var UpdateCacheStatus;
  (function(UpdateCacheStatus2) {
    UpdateCacheStatus2[UpdateCacheStatus2["NOT_CACHED"] = 0] = "NOT_CACHED";
    UpdateCacheStatus2[UpdateCacheStatus2["CACHED_BUT_UNUSED"] = 1] = "CACHED_BUT_UNUSED";
    UpdateCacheStatus2[UpdateCacheStatus2["CACHED"] = 2] = "CACHED";
  })(UpdateCacheStatus || (UpdateCacheStatus = {}));

  // packages/service-worker/worker/src/error.js
  var SwCriticalError = class extends Error {
    constructor() {
      super(...arguments);
      __publicField(this, "isCritical", true);
    }
  };
  function errorToString(error) {
    if (error instanceof Error) {
      return `${error.message}
${error.stack}`;
    } else {
      return `${error}`;
    }
  }
  var SwUnrecoverableStateError = class extends SwCriticalError {
    constructor() {
      super(...arguments);
      __publicField(this, "isUnrecoverableState", true);
    }
  };

  // packages/service-worker/worker/src/sha1.js
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
    let [a, b, c, d, e] = [1732584193, 4023233417, 2562383102, 271733878, 3285377520];
    words32[len >> 5] |= 128 << 24 - len % 32;
    words32[(len + 64 >> 9 << 4) + 15] = len;
    for (let i = 0; i < words32.length; i += 16) {
      const [h0, h1, h2, h3, h4] = [a, b, c, d, e];
      for (let j = 0; j < 80; j++) {
        if (j < 16) {
          w[j] = words32[i + j];
        } else {
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
    const low = (a & 65535) + (b & 65535);
    const high = (a >>> 16) + (b >>> 16) + (low >>> 16);
    return [high >>> 16, high << 16 | low & 65535];
  }
  function rol32(a, count) {
    return a << count | a >>> 32 - count;
  }
  var Endian;
  (function(Endian2) {
    Endian2[Endian2["Little"] = 0] = "Little";
    Endian2[Endian2["Big"] = 1] = "Big";
  })(Endian || (Endian = {}));
  function fk(index, b, c, d) {
    if (index < 20) {
      return [b & c | ~b & d, 1518500249];
    }
    if (index < 40) {
      return [b ^ c ^ d, 1859775393];
    }
    if (index < 60) {
      return [b & c | b & d | c & d, 2400959708];
    }
    return [b ^ c ^ d, 3395469782];
  }
  function stringToWords32(str, endian) {
    const size = str.length + 3 >>> 2;
    const words32 = [];
    for (let i = 0; i < size; i++) {
      words32[i] = wordAt(str, i * 4, endian);
    }
    return words32;
  }
  function arrayBufferToWords32(buffer, endian) {
    const size = buffer.byteLength + 3 >>> 2;
    const words32 = [];
    const view = new Uint8Array(buffer);
    for (let i = 0; i < size; i++) {
      words32[i] = wordAt(view, i * 4, endian);
    }
    return words32;
  }
  function byteAt(str, index) {
    if (typeof str === "string") {
      return index >= str.length ? 0 : str.charCodeAt(index) & 255;
    } else {
      return index >= str.byteLength ? 0 : str[index] & 255;
    }
  }
  function wordAt(str, index, endian) {
    let word = 0;
    if (endian === Endian.Big) {
      for (let i = 0; i < 4; i++) {
        word += byteAt(str, index + i) << 24 - 8 * i;
      }
    } else {
      for (let i = 0; i < 4; i++) {
        word += byteAt(str, index + i) << 8 * i;
      }
    }
    return word;
  }
  function words32ToByteString(words32) {
    return words32.reduce((str, word) => str + word32ToByteString(word), "");
  }
  function word32ToByteString(word) {
    let str = "";
    for (let i = 0; i < 4; i++) {
      str += String.fromCharCode(word >>> 8 * (3 - i) & 255);
    }
    return str;
  }
  function byteStringToHexString(str) {
    let hex = "";
    for (let i = 0; i < str.length; i++) {
      const b = byteAt(str, i);
      hex += (b >>> 4).toString(16) + (b & 15).toString(16);
    }
    return hex.toLowerCase();
  }

  // packages/service-worker/worker/src/assets.js
  var AssetGroup = class {
    constructor(scope2, adapter2, idle, config, hashes, db, cacheNamePrefix) {
      __publicField(this, "scope");
      __publicField(this, "adapter");
      __publicField(this, "idle");
      __publicField(this, "config");
      __publicField(this, "hashes");
      __publicField(this, "db");
      /**
       * A deduplication cache, to make sure the SW never makes two network requests
       * for the same resource at once. Managed by `fetchAndCacheOnce`.
       */
      __publicField(this, "inFlightRequests", /* @__PURE__ */ new Map());
      /**
       * Normalized resource URLs.
       */
      __publicField(this, "urls", []);
      /**
       * Regular expression patterns.
       */
      __publicField(this, "patterns", []);
      /**
       * A Promise which resolves to the `Cache` used to back this asset group. This
       * is opened from the constructor.
       */
      __publicField(this, "cache");
      /**
       * Group name from the configuration.
       */
      __publicField(this, "name");
      /**
       * Metadata associated with specific cache entries.
       */
      __publicField(this, "metadata");
      this.scope = scope2;
      this.adapter = adapter2;
      this.idle = idle;
      this.config = config;
      this.hashes = hashes;
      this.db = db;
      this.name = config.name;
      this.urls = config.urls.map((url) => adapter2.normalizeUrl(url));
      this.patterns = config.patterns.map((pattern) => new RegExp(pattern));
      this.cache = adapter2.caches.open(`${cacheNamePrefix}:${config.name}:cache`);
      this.metadata = this.db.open(`${cacheNamePrefix}:${config.name}:meta`, config.cacheQueryOptions);
    }
    async cacheStatus(url) {
      const cache = await this.cache;
      const meta = await this.metadata;
      const req = this.adapter.newRequest(url);
      const res = await cache.match(req, this.config.cacheQueryOptions);
      if (res === void 0) {
        return UpdateCacheStatus.NOT_CACHED;
      }
      try {
        const data = await meta.read(req.url);
        if (!data.used) {
          return UpdateCacheStatus.CACHED_BUT_UNUSED;
        }
      } catch (_) {
      }
      return UpdateCacheStatus.CACHED;
    }
    /**
     * Return a list of the names of all caches used by this group.
     */
    async getCacheNames() {
      const [cache, metadata] = await Promise.all([this.cache, this.metadata]);
      return [cache.name, metadata.cacheName];
    }
    /**
     * Process a request for a given resource and return it, or return null if it's not available.
     */
    async handleFetch(req, _event) {
      const url = this.adapter.normalizeUrl(req.url);
      if (this.urls.indexOf(url) !== -1 || this.patterns.some((pattern) => pattern.test(url))) {
        const cache = await this.cache;
        let cachedResponse;
        try {
          cachedResponse = await cache.match(req, this.config.cacheQueryOptions);
        } catch (error) {
          throw new SwCriticalError(`Cache is throwing while looking for a match: ${error}`);
        }
        if (cachedResponse !== void 0) {
          if (this.hashes.has(url)) {
            return cachedResponse;
          } else {
            if (await this.needToRevalidate(req, cachedResponse)) {
              this.idle.schedule(`revalidate(${cache.name}): ${req.url}`, async () => {
                await this.fetchAndCacheOnce(req);
              });
            }
            return cachedResponse;
          }
        }
        const res = await this.fetchAndCacheOnce(this.newRequestWithMetadata(req.url, req));
        return res.clone();
      } else {
        return null;
      }
    }
    /**
     * Some resources are cached without a hash, meaning that their expiration is controlled
     * by HTTP caching headers. Check whether the given request/response pair is still valid
     * per the caching headers.
     */
    async needToRevalidate(req, res) {
      if (res.headers.has("Cache-Control")) {
        const cacheControl = res.headers.get("Cache-Control");
        const cacheDirectives = cacheControl.split(",").map((v) => v.trim()).map((v) => v.split("="));
        cacheDirectives.forEach((v) => v[0] = v[0].toLowerCase());
        const maxAgeDirective = cacheDirectives.find((v) => v[0] === "max-age");
        const cacheAge = maxAgeDirective ? maxAgeDirective[1] : void 0;
        if (!cacheAge) {
          return true;
        }
        try {
          const maxAge = 1e3 * parseInt(cacheAge);
          let ts;
          try {
            const metaTable = await this.metadata;
            ts = (await metaTable.read(req.url)).ts;
          } catch (e) {
            const date = res.headers.get("Date");
            if (date === null) {
              return true;
            }
            ts = Date.parse(date);
          }
          const age = this.adapter.time - ts;
          return age < 0 || age > maxAge;
        } catch (e) {
          return true;
        }
      } else if (res.headers.has("Expires")) {
        const expiresStr = res.headers.get("Expires");
        try {
          return this.adapter.time > Date.parse(expiresStr);
        } catch (e) {
          return true;
        }
      } else {
        return true;
      }
    }
    /**
     * Fetch the complete state of a cached resource, or return null if it's not found.
     */
    async fetchFromCacheOnly(url) {
      const cache = await this.cache;
      const metaTable = await this.metadata;
      const request = this.adapter.newRequest(url);
      const response = await cache.match(request, this.config.cacheQueryOptions);
      if (response === void 0) {
        return null;
      }
      let metadata = void 0;
      try {
        metadata = await metaTable.read(request.url);
      } catch (e) {
      }
      return { response, metadata };
    }
    /**
     * Lookup all resources currently stored in the cache which have no associated hash.
     */
    async unhashedResources() {
      const cache = await this.cache;
      return (await cache.keys()).map((request) => this.adapter.normalizeUrl(request.url)).filter((url) => !this.hashes.has(url));
    }
    /**
     * Fetch the given resource from the network, and cache it if able.
     */
    async fetchAndCacheOnce(req, used = true) {
      if (this.inFlightRequests.has(req.url)) {
        return this.inFlightRequests.get(req.url);
      }
      const fetchOp = this.fetchFromNetwork(req);
      this.inFlightRequests.set(req.url, fetchOp);
      try {
        const res = await fetchOp;
        if (!res.ok) {
          throw new Error(`Response not Ok (fetchAndCacheOnce): request for ${req.url} returned response ${res.status} ${res.statusText}`);
        }
        try {
          const cache = await this.cache;
          await cache.put(req, res.clone());
          if (!this.hashes.has(this.adapter.normalizeUrl(req.url))) {
            const meta = { ts: this.adapter.time, used };
            const metaTable = await this.metadata;
            await metaTable.write(req.url, meta);
          }
          return res;
        } catch (err) {
          throw new SwCriticalError(`Failed to update the caches for request to '${req.url}' (fetchAndCacheOnce): ${errorToString(err)}`);
        }
      } finally {
        this.inFlightRequests.delete(req.url);
      }
    }
    async fetchFromNetwork(req, redirectLimit = 3) {
      const res = await this.cacheBustedFetchFromNetwork(req);
      if (res["redirected"] && !!res.url) {
        if (redirectLimit === 0) {
          throw new SwCriticalError(`Response hit redirect limit (fetchFromNetwork): request redirected too many times, next is ${res.url}`);
        }
        return this.fetchFromNetwork(this.newRequestWithMetadata(res.url, req), redirectLimit - 1);
      }
      return res;
    }
    /**
     * Load a particular asset from the network, accounting for hash validation.
     */
    async cacheBustedFetchFromNetwork(req) {
      const url = this.adapter.normalizeUrl(req.url);
      if (this.hashes.has(url)) {
        const canonicalHash = this.hashes.get(url);
        let response = await this.safeFetch(req);
        let makeCacheBustedRequest = response.ok;
        if (makeCacheBustedRequest) {
          const fetchedHash = sha1Binary(await response.clone().arrayBuffer());
          makeCacheBustedRequest = fetchedHash !== canonicalHash;
        }
        if (makeCacheBustedRequest) {
          const cacheBustReq = this.newRequestWithMetadata(this.cacheBust(req.url), req);
          response = await this.safeFetch(cacheBustReq);
          if (response.ok) {
            const cacheBustedHash = sha1Binary(await response.clone().arrayBuffer());
            if (canonicalHash !== cacheBustedHash) {
              throw new SwCriticalError(`Hash mismatch (cacheBustedFetchFromNetwork): ${req.url}: expected ${canonicalHash}, got ${cacheBustedHash} (after cache busting)`);
            }
          }
        }
        if (!response.ok && response.status === 404) {
          throw new SwUnrecoverableStateError(`Failed to retrieve hashed resource from the server. (AssetGroup: ${this.config.name} | URL: ${url})`);
        }
        return response;
      } else {
        return this.safeFetch(req);
      }
    }
    /**
     * Possibly update a resource, if it's expired and needs to be updated. A no-op otherwise.
     */
    async maybeUpdate(updateFrom, req, cache) {
      const url = this.adapter.normalizeUrl(req.url);
      if (this.hashes.has(url)) {
        const hash = this.hashes.get(url);
        const res = await updateFrom.lookupResourceWithHash(url, hash);
        if (res !== null) {
          await cache.put(req, res);
          return true;
        }
      }
      return false;
    }
    /**
     * Create a new `Request` based on the specified URL and `RequestInit` options, preserving only
     * metadata that are known to be safe.
     *
     * Currently, headers, referrer, referrer policy, redirect policy, an explicit
     * `credentials: 'omit'`, and the HTTP cache mode are preserved. On cross-origin redirects,
     * sensitive headers are removed. This includes `Authorization`, as required by the Fetch redirect
     * algorithm, and forbidden request headers that could contain credentials.
     *
     * NOTE:
     *   `credentials: 'same-origin'` and `credentials: 'include'` are intentionally not preserved.
     *   Forwarding `'include'` could leak cookies to cross-origin asset hosts, and forwarding
     *   `'same-origin'` matches the default `fetch()` behavior so there is nothing to preserve.
     *   Requests with `cache: 'only-if-cached'` and `mode !== 'same-origin'` are short-circuited
     *   earlier in `Driver.onFetch()` (they are a known Chrome DevTools quirk), so no special
     *   handling for that combination is needed here.
     * TODO(gkalpak):
     *   Investigate preserving more metadata. See, also, discussion on preserving `mode`:
     *   https://github.com/angular/angular/issues/41931#issuecomment-1227601347.
     */
    newRequestWithMetadata(url, options) {
      let headers = options.headers;
      const parsedUrl = this.adapter.parseUrl(url, this.adapter.origin);
      const hasHeaders = headers.keys().next().done !== true;
      if (hasHeaders && parsedUrl.origin !== this.adapter.origin) {
        headers = this.adapter.newHeaders(options.headers);
        headers.delete("Authorization");
        headers.delete("Proxy-Authorization");
        headers.delete("Cookie");
      }
      const init = {
        headers,
        referrer: options.referrer,
        referrerPolicy: options.referrerPolicy,
        redirect: options.redirect
      };
      if (options.credentials === "omit") {
        init.credentials = "omit";
      }
      if (options.cache !== void 0) {
        init.cache = options.cache;
      }
      return this.adapter.newRequest(url, init);
    }
    /**
     * Construct a cache-busting URL for a given URL.
     */
    cacheBust(url) {
      return url + (url.indexOf("?") === -1 ? "?" : "&") + "ngsw-cache-bust=" + Math.random();
    }
    async safeFetch(req) {
      try {
        return await this.scope.fetch(req);
      } catch (e) {
        return this.adapter.newResponse("", {
          status: 504,
          statusText: "Gateway Timeout"
        });
      }
    }
  };
  var PrefetchAssetGroup = class extends AssetGroup {
    async initializeFully(updateFrom) {
      const cache = await this.cache;
      await this.urls.reduce(async (previous, url) => {
        await previous;
        const req = this.adapter.newRequest(url);
        let alreadyCached = false;
        try {
          alreadyCached = await cache.match(req, this.config.cacheQueryOptions) !== void 0;
        } catch (error) {
          throw new SwCriticalError(`Cache is throwing while looking for a match in a PrefetchAssetGroup: ${error}`);
        }
        if (alreadyCached) {
          return;
        }
        if (updateFrom !== void 0 && await this.maybeUpdate(updateFrom, req, cache)) {
          return;
        }
        await this.fetchAndCacheOnce(req, false);
      }, Promise.resolve());
      if (updateFrom !== void 0) {
        const metaTable = await this.metadata;
        await (await updateFrom.previouslyCachedResources()).filter((url) => this.urls.indexOf(url) !== -1 || this.patterns.some((pattern) => pattern.test(url))).reduce(async (previous, url) => {
          await previous;
          const req = this.adapter.newRequest(url);
          const alreadyCached = await cache.match(req, this.config.cacheQueryOptions) !== void 0;
          if (alreadyCached) {
            return;
          }
          const res = await updateFrom.lookupResourceWithoutHash(url);
          if (res === null || res.metadata === void 0) {
            return;
          }
          await cache.put(req, res.response);
          await metaTable.write(req.url, __spreadProps(__spreadValues({}, res.metadata), { used: false }));
        }, Promise.resolve());
      }
    }
  };
  var LazyAssetGroup = class extends AssetGroup {
    async initializeFully(updateFrom) {
      if (updateFrom === void 0) {
        return;
      }
      const cache = await this.cache;
      await this.urls.reduce(async (previous, url) => {
        await previous;
        const req = this.adapter.newRequest(url);
        let alreadyCached = false;
        try {
          alreadyCached = await cache.match(req, this.config.cacheQueryOptions) !== void 0;
        } catch (error) {
          throw new SwCriticalError(`Cache is throwing while looking for a match in a LazyAssetGroup: ${error}`);
        }
        if (alreadyCached) {
          return;
        }
        const updated = await this.maybeUpdate(updateFrom, req, cache);
        if (this.config.updateMode === "prefetch" && !updated) {
          const cacheStatus = await updateFrom.recentCacheStatus(url);
          if (cacheStatus !== UpdateCacheStatus.CACHED) {
            return;
          }
          await this.fetchAndCacheOnce(req, false);
        }
      }, Promise.resolve());
    }
  };

  // packages/service-worker/worker/src/data.js
  var LruList = class {
    constructor(state) {
      __publicField(this, "state");
      if (state === void 0) {
        state = {
          head: null,
          tail: null,
          map: {},
          count: 0
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
      if (this.state.tail === null) {
        return null;
      }
      const url = this.state.tail;
      this.remove(url);
      return url;
    }
    remove(url) {
      const node = this.state.map[url];
      if (node === void 0) {
        return false;
      }
      if (this.state.head === url) {
        if (node.next === null) {
          this.state.head = null;
          this.state.tail = null;
          this.state.map = {};
          this.state.count = 0;
          return true;
        }
        const next = this.state.map[node.next];
        next.previous = null;
        this.state.head = next.url;
        node.next = null;
        delete this.state.map[url];
        this.state.count--;
        return true;
      }
      const previous = this.state.map[node.previous];
      previous.next = node.next;
      if (node.next !== null) {
        this.state.map[node.next].previous = node.previous;
      } else {
        this.state.tail = node.previous;
      }
      node.next = null;
      node.previous = null;
      delete this.state.map[url];
      this.state.count--;
      return true;
    }
    accessed(url) {
      if (this.state.head === url) {
        return;
      }
      const node = this.state.map[url] || { url, next: null, previous: null };
      if (this.state.map[url] !== void 0) {
        this.remove(url);
      }
      if (this.state.head !== null) {
        this.state.map[this.state.head].previous = url;
      }
      node.next = this.state.head;
      this.state.head = url;
      if (this.state.tail === null) {
        this.state.tail = url;
      }
      this.state.map[url] = node;
      this.state.count++;
    }
  };
  var DataGroup = class {
    constructor(scope2, adapter2, config, db, debugHandler, cacheNamePrefix) {
      __publicField(this, "scope");
      __publicField(this, "adapter");
      __publicField(this, "config");
      __publicField(this, "db");
      __publicField(this, "debugHandler");
      /**
       * Compiled regular expression set used to determine which resources fall under the purview
       * of this group.
       */
      __publicField(this, "patterns");
      /**
       * The `Cache` instance in which resources belonging to this group are cached.
       */
      __publicField(this, "cache");
      /**
       * Tracks the LRU state of resources in this cache.
       */
      __publicField(this, "_lru", null);
      /**
       * Database table used to store the state of the LRU cache.
       */
      __publicField(this, "lruTable");
      /**
       * Database table used to store metadata for resources in the cache.
       */
      __publicField(this, "ageTable");
      this.scope = scope2;
      this.adapter = adapter2;
      this.config = config;
      this.db = db;
      this.debugHandler = debugHandler;
      this.patterns = config.patterns.map((pattern) => new RegExp(pattern));
      this.cache = adapter2.caches.open(`${cacheNamePrefix}:${config.name}:cache`);
      this.lruTable = this.db.open(`${cacheNamePrefix}:${config.name}:lru`, config.cacheQueryOptions);
      this.ageTable = this.db.open(`${cacheNamePrefix}:${config.name}:age`, config.cacheQueryOptions);
    }
    /**
     * Lazily initialize/load the LRU chain.
     */
    async lru() {
      if (this._lru === null) {
        const table = await this.lruTable;
        try {
          this._lru = new LruList(await table.read("lru"));
        } catch (e) {
          this._lru = new LruList();
        }
      }
      return this._lru;
    }
    /**
     * Sync the LRU chain to non-volatile storage.
     */
    async syncLru() {
      if (this._lru === null) {
        return;
      }
      const table = await this.lruTable;
      try {
        return table.write("lru", this._lru.state);
      } catch (err) {
        this.debugHandler.log(err, `DataGroup(${this.config.name}@${this.config.version}).syncLru()`);
        await this.detectStorageFull();
      }
    }
    /**
     * Process a fetch event and return a `Response` if the resource is covered by this group,
     * or `null` otherwise.
     */
    async handleFetch(req, event) {
      if (!this.patterns.some((pattern) => pattern.test(req.url))) {
        return null;
      }
      const lru = await this.lru();
      switch (req.method) {
        case "OPTIONS":
          return null;
        case "GET":
        case "HEAD":
          switch (this.config.strategy) {
            case "freshness":
              return this.handleFetchWithFreshness(req, event, lru);
            case "performance":
              return this.handleFetchWithPerformance(req, event, lru);
            default:
              throw new Error(`Unknown strategy: ${this.config.strategy}`);
          }
        default:
          const wasCached = lru.remove(req.url);
          if (wasCached) {
            await this.clearCacheForUrl(req.url);
          }
          await this.syncLru();
          return this.safeFetch(req);
      }
    }
    async handleFetchWithPerformance(req, event, lru) {
      var _a;
      const okToCacheOpaque = (_a = this.config.cacheOpaqueResponses) != null ? _a : false;
      let res = null;
      const fromCache = await this.loadFromCache(req, lru);
      if (fromCache !== null) {
        res = fromCache.res;
        if (this.config.refreshAheadMs !== void 0 && fromCache.age >= this.config.refreshAheadMs) {
          event.waitUntil(this.safeCacheResponse(req, this.safeFetch(req), lru, okToCacheOpaque));
        }
      }
      if (res !== null) {
        return res;
      }
      const [timeoutFetch, networkFetch] = this.networkFetchWithTimeout(req);
      res = await timeoutFetch;
      if (res === void 0) {
        res = this.adapter.newResponse(null, { status: 504, statusText: "Gateway Timeout" });
        event.waitUntil(this.safeCacheResponse(req, networkFetch, lru, okToCacheOpaque));
      } else {
        await this.safeCacheResponse(req, res, lru, okToCacheOpaque);
      }
      return res;
    }
    async handleFetchWithFreshness(req, event, lru) {
      var _a;
      const okToCacheOpaque = (_a = this.config.cacheOpaqueResponses) != null ? _a : true;
      const [timeoutFetch, networkFetch] = this.networkFetchWithTimeout(req);
      let res;
      try {
        res = await timeoutFetch;
      } catch (e) {
        res = void 0;
      }
      if (res === void 0) {
        event.waitUntil(this.safeCacheResponse(req, networkFetch, lru, okToCacheOpaque));
        const fromCache = await this.loadFromCache(req, lru);
        res = fromCache !== null ? fromCache.res : null;
      } else {
        await this.safeCacheResponse(req, res, lru, okToCacheOpaque);
      }
      if (res !== null) {
        return res;
      }
      return networkFetch;
    }
    networkFetchWithTimeout(req) {
      if (this.config.timeoutMs !== void 0) {
        const networkFetch = this.scope.fetch(req);
        const safeNetworkFetch = (async () => {
          try {
            return await networkFetch;
          } catch (e) {
            return this.adapter.newResponse(null, {
              status: 504,
              statusText: "Gateway Timeout"
            });
          }
        })();
        const networkFetchUndefinedError = (async () => {
          try {
            return await networkFetch;
          } catch (e) {
            return void 0;
          }
        })();
        const timeout = this.adapter.timeout(this.config.timeoutMs);
        return [Promise.race([networkFetchUndefinedError, timeout]), safeNetworkFetch];
      } else {
        const networkFetch = this.safeFetch(req);
        return [networkFetch, networkFetch];
      }
    }
    async safeCacheResponse(req, resOrPromise, lru, okToCacheOpaque) {
      try {
        const res = await resOrPromise;
        try {
          await this.cacheResponse(req, res, lru, okToCacheOpaque);
        } catch (err) {
          this.debugHandler.log(err, `DataGroup(${this.config.name}@${this.config.version}).safeCacheResponse(${req.url}, status: ${res.status})`);
          await this.detectStorageFull();
        }
      } catch (e) {
      }
    }
    async loadFromCache(req, lru) {
      const cache = await this.cache;
      let res = await cache.match(req, this.config.cacheQueryOptions);
      if (res !== void 0) {
        try {
          const ageTable = await this.ageTable;
          const age = this.adapter.time - (await ageTable.read(req.url)).age;
          if (age <= this.config.maxAge) {
            lru.accessed(req.url);
            return { res, age };
          }
        } catch (e) {
        }
        lru.remove(req.url);
        await this.clearCacheForUrl(req.url);
        await this.syncLru();
      }
      return null;
    }
    /**
     * Operation for caching the response from the server. This has to happen all
     * at once, so that the cache and LRU tracking remain in sync. If the network request
     * completes before the timeout, this logic will be run inline with the response flow.
     * If the request times out on the server, an error will be returned but the real network
     * request will still be running in the background, to be cached when it completes.
     */
    async cacheResponse(req, res, lru, okToCacheOpaque = false) {
      if (!(res.ok || okToCacheOpaque && res.type === "opaque")) {
        return;
      }
      if (lru.size >= this.config.maxSize) {
        const evictedUrl = lru.pop();
        if (evictedUrl !== null) {
          await this.clearCacheForUrl(evictedUrl);
        }
      }
      lru.accessed(req.url);
      await (await this.cache).put(req, res.clone());
      const ageTable = await this.ageTable;
      await ageTable.write(req.url, { age: this.adapter.time });
      await this.syncLru();
    }
    /**
     * Delete all of the saved state which this group uses to track resources.
     */
    async cleanup() {
      await Promise.all([
        this.cache.then((cache) => this.adapter.caches.delete(cache.name)),
        this.ageTable.then((table) => this.db.delete(table.name)),
        this.lruTable.then((table) => this.db.delete(table.name))
      ]);
    }
    /**
     * Return a list of the names of all caches used by this group.
     */
    async getCacheNames() {
      const [cache, ageTable, lruTable] = await Promise.all([
        this.cache,
        this.ageTable,
        this.lruTable
      ]);
      return [cache.name, ageTable.cacheName, lruTable.cacheName];
    }
    /**
     * Clear the state of the cache for a particular resource.
     *
     * This doesn't remove the resource from the LRU table, that is assumed to have
     * been done already. This clears the GET and HEAD versions of the request from
     * the cache itself, as well as the metadata stored in the age table.
     */
    async clearCacheForUrl(url) {
      const [cache, ageTable] = await Promise.all([this.cache, this.ageTable]);
      await Promise.all([
        cache.delete(this.adapter.newRequest(url, { method: "GET" }), this.config.cacheQueryOptions),
        cache.delete(this.adapter.newRequest(url, { method: "HEAD" }), this.config.cacheQueryOptions),
        ageTable.delete(url)
      ]);
    }
    async safeFetch(req) {
      try {
        return this.scope.fetch(req);
      } catch (e) {
        return this.adapter.newResponse(null, {
          status: 504,
          statusText: "Gateway Timeout"
        });
      }
    }
    /**
     * Detect if storage is full or approaching capacity.
     * Returns true if storage is at or near capacity.
     */
    async detectStorageFull() {
      try {
        const estimate = await navigator.storage.estimate();
        const { quota, usage } = estimate;
        if (typeof quota !== "number" || typeof usage !== "number") {
          return;
        }
        const usagePercentage = usage / quota * 100;
        const isStorageFull = usagePercentage >= 95;
        if (isStorageFull) {
          this.debugHandler.log("Storage is full or nearly full", `DataGroup(${this.config.name}@${this.config.version}).detectStorageFull()`);
        }
      } catch (e) {
      }
    }
  };

  // packages/service-worker/worker/src/app-version.js
  var AppVersion = class {
    constructor(scope2, adapter2, database, idle, debugHandler, manifest, manifestHash) {
      __publicField(this, "scope");
      __publicField(this, "adapter");
      __publicField(this, "database");
      __publicField(this, "debugHandler");
      __publicField(this, "manifest");
      __publicField(this, "manifestHash");
      /**
       * A Map of absolute URL paths (`/foo.txt`) to the known hash of their contents (if available).
       */
      __publicField(this, "hashTable", /* @__PURE__ */ new Map());
      /**
       * All of the asset groups active in this version of the app.
       */
      __publicField(this, "assetGroups");
      /**
       * All of the data groups active in this version of the app.
       */
      __publicField(this, "dataGroups");
      /**
       * Requests to URLs that match any of the `include` RegExps and none of the `exclude` RegExps
       * are considered navigation requests and handled accordingly.
       */
      __publicField(this, "navigationUrls");
      /**
       * The normalized URL to the file that serves as the index page to satisfy navigation requests.
       * Usually this is `/index.html`.
       */
      __publicField(this, "indexUrl");
      /**
       * Tracks whether the manifest has encountered any inconsistencies.
       */
      __publicField(this, "_okay", true);
      this.scope = scope2;
      this.adapter = adapter2;
      this.database = database;
      this.debugHandler = debugHandler;
      this.manifest = manifest;
      this.manifestHash = manifestHash;
      this.indexUrl = this.adapter.normalizeUrl(this.manifest.index);
      Object.keys(manifest.hashTable).forEach((url) => {
        this.hashTable.set(adapter2.normalizeUrl(url), manifest.hashTable[url]);
      });
      const assetCacheNamePrefix = `${manifestHash}:assets`;
      this.assetGroups = (manifest.assetGroups || []).map((config) => {
        switch (config.installMode) {
          case "prefetch":
            return new PrefetchAssetGroup(scope2, adapter2, idle, config, this.hashTable, database, assetCacheNamePrefix);
          case "lazy":
            return new LazyAssetGroup(scope2, adapter2, idle, config, this.hashTable, database, assetCacheNamePrefix);
        }
      });
      this.dataGroups = (manifest.dataGroups || []).map((config) => new DataGroup(scope2, adapter2, config, database, debugHandler, `${config.version}:data`));
      const includeUrls = manifest.navigationUrls.filter((spec) => spec.positive);
      const excludeUrls = manifest.navigationUrls.filter((spec) => !spec.positive);
      this.navigationUrls = {
        include: includeUrls.map((spec) => new RegExp(spec.regex)),
        exclude: excludeUrls.map((spec) => new RegExp(spec.regex))
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
    async initializeFully(updateFrom) {
      try {
        await this.assetGroups.reduce(async (previous, group) => {
          await previous;
          return group.initializeFully(updateFrom);
        }, Promise.resolve());
      } catch (err) {
        this._okay = false;
        throw err;
      }
    }
    async handleFetch(req, event) {
      const asset = await this.assetGroups.reduce(async (potentialResponse, group) => {
        const resp = await potentialResponse;
        if (resp !== null) {
          return resp;
        }
        return group.handleFetch(req, event);
      }, Promise.resolve(null));
      if (asset !== null) {
        return asset;
      }
      const data = await this.dataGroups.reduce(async (potentialResponse, group) => {
        const resp = await potentialResponse;
        if (resp !== null) {
          return resp;
        }
        return group.handleFetch(req, event);
      }, Promise.resolve(null));
      if (data !== null) {
        return data;
      }
      if (this.adapter.normalizeUrl(req.url) !== this.indexUrl && this.isNavigationRequest(req)) {
        if (this.manifest.navigationRequestStrategy === "freshness") {
          try {
            return await this.scope.fetch(req);
          } catch (e) {
          }
        }
        return this.handleFetch(this.adapter.newRequest(this.indexUrl), event);
      }
      return null;
    }
    /**
     * Determine whether the request is a navigation request.
     * Takes into account: Request method and mode, `Accept` header, `navigationUrls` patterns.
     */
    isNavigationRequest(req) {
      if (req.method !== "GET" || req.mode !== "navigate") {
        return false;
      }
      if (!this.acceptsTextHtml(req)) {
        return false;
      }
      const urlPrefix = this.scope.registration.scope.replace(/\/$/, "");
      const url = req.url.startsWith(urlPrefix) ? req.url.slice(urlPrefix.length) : req.url;
      const urlWithoutQueryOrHash = url.replace(/[?#].*$/, "");
      return this.navigationUrls.include.some((regex) => regex.test(urlWithoutQueryOrHash)) && !this.navigationUrls.exclude.some((regex) => regex.test(urlWithoutQueryOrHash));
    }
    /**
     * Check this version for a given resource with a particular hash.
     */
    async lookupResourceWithHash(url, hash) {
      if (!this.hashTable.has(url)) {
        return null;
      }
      if (this.hashTable.get(url) !== hash) {
        return null;
      }
      const cacheState = await this.lookupResourceWithoutHash(url);
      return cacheState && cacheState.response;
    }
    /**
     * Check this version for a given resource regardless of its hash.
     */
    lookupResourceWithoutHash(url) {
      return this.assetGroups.reduce(async (potentialResponse, group) => {
        const resp = await potentialResponse;
        if (resp !== null) {
          return resp;
        }
        return group.fetchFromCacheOnly(url);
      }, Promise.resolve(null));
    }
    /**
     * List all unhashed resources from all asset groups.
     */
    previouslyCachedResources() {
      return this.assetGroups.reduce(async (resources, group) => (await resources).concat(await group.unhashedResources()), Promise.resolve([]));
    }
    async recentCacheStatus(url) {
      return this.assetGroups.reduce(async (current, group) => {
        const status = await current;
        if (status === UpdateCacheStatus.CACHED) {
          return status;
        }
        const groupStatus = await group.cacheStatus(url);
        if (groupStatus === UpdateCacheStatus.NOT_CACHED) {
          return status;
        }
        return groupStatus;
      }, Promise.resolve(UpdateCacheStatus.NOT_CACHED));
    }
    /**
     * Return a list of the names of all caches used by this version.
     */
    async getCacheNames() {
      const allGroupCacheNames = await Promise.all([
        ...this.assetGroups.map((group) => group.getCacheNames()),
        ...this.dataGroups.map((group) => group.getCacheNames())
      ]);
      return [].concat(...allGroupCacheNames);
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
      const accept = req.headers.get("Accept");
      if (accept === null) {
        return false;
      }
      const values = accept.split(",");
      return values.some((value) => value.trim().toLowerCase() === "text/html");
    }
  };

  // packages/service-worker/worker/src/debug.js
  var SW_VERSION = "22.2.4";
  var DEBUG_LOG_BUFFER_SIZE = 100;
  var DebugHandler = class {
    constructor(driver, adapter2) {
      __publicField(this, "driver");
      __publicField(this, "adapter");
      // There are two debug log message arrays. debugLogA records new debugging messages.
      // Once it reaches DEBUG_LOG_BUFFER_SIZE, the array is moved to debugLogB and a new
      // array is assigned to debugLogA. This ensures that insertion to the debug log is
      // always O(1) no matter the number of logged messages, and that the total number
      // of messages in the log never exceeds 2 * DEBUG_LOG_BUFFER_SIZE.
      __publicField(this, "debugLogA", []);
      __publicField(this, "debugLogB", []);
      this.driver = driver;
      this.adapter = adapter2;
    }
    async handleFetch(req) {
      const [state, versions, idle] = await Promise.all([
        this.driver.debugState(),
        this.driver.debugVersions(),
        this.driver.debugIdleState()
      ]);
      const msgState = `NGSW Debug Info:

Driver version: ${SW_VERSION}
Driver state: ${state.state} (${state.why})
Latest manifest hash: ${state.latestHash || "none"}
Last update check: ${this.since(state.lastUpdateCheck)}`;
      const msgVersions = versions.map((version) => `=== Version ${version.hash} ===

Clients: ${version.clients.join(", ")}`).join("\n\n");
      const msgIdle = `=== Idle Task Queue ===
Last update tick: ${this.since(idle.lastTrigger)}
Last update run: ${this.since(idle.lastRun)}
Task queue:
${idle.queue.map((v) => " * " + v).join("\n")}

Debug log:
${this.formatDebugLog(this.debugLogB)}
${this.formatDebugLog(this.debugLogA)}
`;
      return this.adapter.newResponse(`${msgState}

${msgVersions}

${msgIdle}`, { headers: this.adapter.newHeaders({ "Content-Type": "text/plain" }) });
    }
    since(time) {
      if (time === null) {
        return "never";
      }
      let age = this.adapter.time - time;
      const days = Math.floor(age / 864e5);
      age = age % 864e5;
      const hours = Math.floor(age / 36e5);
      age = age % 36e5;
      const minutes = Math.floor(age / 6e4);
      age = age % 6e4;
      const seconds = Math.floor(age / 1e3);
      const millis = age % 1e3;
      return (days > 0 ? `${days}d` : "") + (hours > 0 ? `${hours}h` : "") + (minutes > 0 ? `${minutes}m` : "") + (seconds > 0 ? `${seconds}s` : "") + (millis > 0 ? `${millis}u` : "");
    }
    log(value, context = "") {
      if (this.debugLogA.length === DEBUG_LOG_BUFFER_SIZE) {
        this.debugLogB = this.debugLogA;
        this.debugLogA = [];
      }
      if (typeof value !== "string") {
        value = this.errorToString(value);
      }
      this.debugLogA.push({ value, time: this.adapter.time, context });
    }
    errorToString(err) {
      return `${err.name}(${err.message}, ${err.stack})`;
    }
    formatDebugLog(log) {
      return log.map((entry) => `[${this.since(entry.time)}] ${entry.value} ${entry.context}`).join("\n");
    }
  };

  // packages/service-worker/worker/src/idle.js
  var IdleScheduler = class {
    constructor(adapter2, delay, maxDelay, debug) {
      __publicField(this, "adapter");
      __publicField(this, "delay");
      __publicField(this, "maxDelay");
      __publicField(this, "debug");
      __publicField(this, "queue", []);
      __publicField(this, "scheduled", null);
      __publicField(this, "empty", Promise.resolve());
      __publicField(this, "emptyResolve", null);
      __publicField(this, "lastTrigger", null);
      __publicField(this, "lastRun", null);
      __publicField(this, "oldestScheduledAt", null);
      this.adapter = adapter2;
      this.delay = delay;
      this.maxDelay = maxDelay;
      this.debug = debug;
    }
    async trigger() {
      var _a;
      this.lastTrigger = this.adapter.time;
      if (this.queue.length === 0) {
        return;
      }
      if (this.scheduled !== null) {
        this.scheduled.cancel = true;
      }
      const scheduled = {
        cancel: false
      };
      this.scheduled = scheduled;
      const now = this.adapter.time;
      const maxDelay = Math.max(0, ((_a = this.oldestScheduledAt) != null ? _a : now) + this.maxDelay - now);
      const delay = Math.min(maxDelay, this.delay);
      await this.adapter.timeout(delay);
      if (scheduled.cancel) {
        return;
      }
      this.scheduled = null;
      await this.execute();
    }
    async execute() {
      this.lastRun = this.adapter.time;
      while (this.queue.length > 0) {
        const queue = this.queue;
        this.queue = [];
        await queue.reduce(async (previous, task) => {
          await previous;
          try {
            await task.run();
          } catch (err) {
            this.debug.log(err, `while running idle task ${task.desc}`);
          }
        }, Promise.resolve());
      }
      if (this.emptyResolve !== null) {
        this.emptyResolve();
        this.emptyResolve = null;
      }
      this.empty = Promise.resolve();
      this.oldestScheduledAt = null;
    }
    schedule(desc, run) {
      this.queue.push({ desc, run });
      if (this.emptyResolve === null) {
        this.empty = new Promise((resolve) => {
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
      return this.queue.map((task) => task.desc);
    }
  };

  // packages/service-worker/worker/src/manifest.js
  function hashManifest(manifest) {
    return sha1(JSON.stringify(manifest));
  }

  // packages/service-worker/worker/src/msg.js
  function isMsgCheckForUpdates(msg) {
    return msg.action === "CHECK_FOR_UPDATES";
  }
  function isMsgActivateUpdate(msg) {
    return msg.action === "ACTIVATE_UPDATE";
  }

  // packages/service-worker/worker/src/driver.js
  var IDLE_DELAY = 5e3;
  var MAX_IDLE_DELAY = 3e4;
  var SUPPORTED_CONFIG_VERSION = 1;
  var NOTIFICATION_OPTION_NAMES = [
    "actions",
    "badge",
    "body",
    "data",
    "dir",
    "icon",
    "image",
    "lang",
    "renotify",
    "requireInteraction",
    "silent",
    "tag",
    "timestamp",
    "title",
    "vibrate"
  ];
  function isLocalhost(scope2) {
    return /(?:^https?:\/\/)?(?:(?:^|[^\w.])localhost|\[::1\]|127(?:\.\d{1,3}){3})(?::\d+)?(?:\/.*)?$/.test(scope2);
  }
  var DriverReadyState;
  (function(DriverReadyState2) {
    DriverReadyState2[DriverReadyState2["NORMAL"] = 0] = "NORMAL";
    DriverReadyState2[DriverReadyState2["EXISTING_CLIENTS_ONLY"] = 1] = "EXISTING_CLIENTS_ONLY";
    DriverReadyState2[DriverReadyState2["SAFE_MODE"] = 2] = "SAFE_MODE";
  })(DriverReadyState || (DriverReadyState = {}));
  var Driver = class {
    constructor(scope2, adapter2, db) {
      __publicField(this, "scope");
      __publicField(this, "adapter");
      __publicField(this, "db");
      /**
       * Tracks the current readiness condition under which the SW is operating. This controls
       * whether the SW attempts to respond to some or all requests.
       */
      __publicField(this, "state", DriverReadyState.NORMAL);
      __publicField(this, "stateMessage", "(nominal)");
      /**
       * Tracks whether the SW is in an initialized state or not. Before initialization,
       * it's not legal to respond to requests.
       */
      __publicField(this, "initialized", null);
      /**
       * Maps client IDs to the manifest hash of the application version being used to serve
       * them. If a client ID is not present here, it has not yet been assigned a version.
       *
       * If a ManifestHash appears here, it is also present in the `versions` map below.
       */
      __publicField(this, "clientVersionMap", /* @__PURE__ */ new Map());
      /**
       * Maps manifest hashes to instances of `AppVersion` for those manifests.
       */
      __publicField(this, "versions", /* @__PURE__ */ new Map());
      /**
       * The latest version fetched from the server.
       *
       * Valid after initialization has completed.
       */
      __publicField(this, "latestHash", null);
      __publicField(this, "lastUpdateCheck", null);
      /**
       * Whether there is a check for updates currently scheduled due to navigation.
       */
      __publicField(this, "scheduledNavUpdateCheck", false);
      /**
       * Keep track of whether we have logged an invalid `only-if-cached` request.
       * (See `.onFetch()` for details.)
       */
      __publicField(this, "loggedInvalidOnlyIfCachedRequest", false);
      __publicField(this, "ngswStatePath");
      /**
       * A scheduler which manages a queue of tasks that need to be executed when the SW is
       * not doing any other work (not processing any other requests).
       */
      __publicField(this, "idle");
      __publicField(this, "debugger");
      // A promise resolving to the control DB table.
      __publicField(this, "controlTable");
      this.scope = scope2;
      this.adapter = adapter2;
      this.db = db;
      this.controlTable = this.db.open("control");
      this.ngswStatePath = this.adapter.parseUrl("ngsw/state", this.scope.registration.scope).path;
      this.scope.addEventListener("install", (event) => {
        event.waitUntil(this.scope.skipWaiting());
      });
      this.scope.addEventListener("activate", (event) => {
        event.waitUntil((async () => {
          await this.scope.clients.claim();
        })());
        if (this.scope.registration.active !== null) {
          this.scope.registration.active.postMessage({ action: "INITIALIZE" });
        }
      });
      this.scope.addEventListener("fetch", (event) => this.onFetch(event));
      this.scope.addEventListener("message", (event) => this.onMessage(event));
      this.scope.addEventListener("push", (event) => this.onPush(event));
      this.scope.addEventListener("notificationclick", (event) => this.onClick(event));
      this.scope.addEventListener("notificationclose", (event) => this.onClose(event));
      this.scope.addEventListener("pushsubscriptionchange", (event) => this.onPushSubscriptionChange(event));
      this.scope.addEventListener("messageerror", (event) => this.onMessageError(event));
      this.scope.addEventListener("unhandledrejection", (event) => this.onUnhandledRejection(event));
      this.debugger = new DebugHandler(this, this.adapter);
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
      if (req.headers.has("ngsw-bypass") || /[?&]ngsw-bypass(?:[=&]|$)/i.test(requestUrlObj.search)) {
        return;
      }
      if (requestUrlObj.path === this.ngswStatePath) {
        event.respondWith(this.debugger.handleFetch(req));
        return;
      }
      if (this.state === DriverReadyState.SAFE_MODE) {
        event.waitUntil(this.idle.trigger());
        return;
      }
      if (requestUrlObj.origin.startsWith("http:") && scopeUrl.startsWith("https:")) {
        this.debugger.log(`Ignoring passive mixed content request: Driver.fetch(${req.url})`);
        return;
      }
      if (req.cache === "only-if-cached" && req.mode !== "same-origin") {
        if (!this.loggedInvalidOnlyIfCachedRequest) {
          this.loggedInvalidOnlyIfCachedRequest = true;
          this.debugger.log(`Ignoring invalid request: 'only-if-cached' can be set only with 'same-origin' mode`, `Driver.fetch(${req.url}, cache: ${req.cache}, mode: ${req.mode})`);
        }
        return;
      }
      event.respondWith(this.handleFetch(event));
    }
    /**
     * The handler for message events.
     */
    onMessage(event) {
      if (this.state === DriverReadyState.SAFE_MODE) {
        return;
      }
      const data = event.data;
      if (!data || !data.action) {
        return;
      }
      event.waitUntil((async () => {
        if (data.action === "INITIALIZE") {
          return this.ensureInitialized(event);
        }
        if (!this.adapter.isClient(event.source)) {
          return;
        }
        await this.ensureInitialized(event);
        await this.handleMessage(data, event.source);
      })());
    }
    onPush(msg) {
      if (!msg.data) {
        return;
      }
      msg.waitUntil(this.handlePush(msg.data.json()));
    }
    onClick(event) {
      event.waitUntil(this.handleClick(event.notification, event.action));
    }
    onClose(event) {
      event.waitUntil(this.handleClose(event.notification, event.action));
    }
    onPushSubscriptionChange(event) {
      event.waitUntil(this.handlePushSubscriptionChange(event));
    }
    onMessageError(event) {
      this.debugger.log(`Message error occurred - data could not be deserialized`, `Driver.onMessageError(origin: ${event.origin})`);
    }
    onUnhandledRejection(event) {
      this.debugger.log(`Unhandled promise rejection occurred`, `Driver.onUnhandledRejection(reason: ${event.reason})`);
    }
    async ensureInitialized(event) {
      if (this.initialized !== null) {
        return this.initialized;
      }
      try {
        this.initialized = this.initialize();
        await this.initialized;
      } catch (error) {
        this.state = DriverReadyState.SAFE_MODE;
        this.stateMessage = `Initialization failed due to error: ${errorToString(error)}`;
        throw error;
      } finally {
        event.waitUntil(this.idle.trigger());
      }
    }
    async handleMessage(msg, from) {
      if (isMsgCheckForUpdates(msg)) {
        const action = this.checkForUpdate();
        await this.completeOperation(from, action, msg.nonce);
      } else if (isMsgActivateUpdate(msg)) {
        const action = this.updateClient(from);
        await this.completeOperation(from, action, msg.nonce);
      }
    }
    async handlePush(data) {
      await this.broadcast({
        type: "PUSH",
        data
      });
      if (!data.notification || !data.notification.title) {
        return;
      }
      const desc = data.notification;
      let options = {};
      NOTIFICATION_OPTION_NAMES.filter((name) => Object.hasOwn(desc, name)).forEach((name) => options[name] = desc[name]);
      await this.scope.registration.showNotification(desc["title"], options);
    }
    async handleClick(notification, action) {
      var _a, _b, _c;
      notification.close();
      const options = {};
      NOTIFICATION_OPTION_NAMES.filter((name) => name in notification).forEach((name) => options[name] = notification[name]);
      const notificationAction = action === "" || action === void 0 ? "default" : action;
      const onActionClick = (_b = (_a = notification == null ? void 0 : notification.data) == null ? void 0 : _a.onActionClick) == null ? void 0 : _b[notificationAction];
      const urlToOpen = new URL((_c = onActionClick == null ? void 0 : onActionClick.url) != null ? _c : "", this.scope.registration.scope).href;
      switch (onActionClick == null ? void 0 : onActionClick.operation) {
        case "openWindow":
          await this.scope.clients.openWindow(urlToOpen);
          break;
        case "focusLastFocusedOrOpen": {
          let matchingClient = await this.getLastFocusedMatchingClient(this.scope);
          if (matchingClient) {
            await (matchingClient == null ? void 0 : matchingClient.focus());
          } else {
            await this.scope.clients.openWindow(urlToOpen);
          }
          break;
        }
        case "navigateLastFocusedOrOpen": {
          let matchingClient = await this.getLastFocusedMatchingClient(this.scope);
          if (matchingClient) {
            matchingClient = await matchingClient.navigate(urlToOpen);
            await (matchingClient == null ? void 0 : matchingClient.focus());
          } else {
            await this.scope.clients.openWindow(urlToOpen);
          }
          break;
        }
        case "sendRequest": {
          await this.scope.fetch(urlToOpen);
          break;
        }
        default:
          break;
      }
      await this.broadcast({
        type: "NOTIFICATION_CLICK",
        data: { action, notification: options }
      });
    }
    /**
     * Handles the closing of a notification by extracting its options and
     * broadcasting a `NOTIFICATION_CLOSE` message.
     *
     * This is typically called when a notification is dismissed by the user
     * or closed programmatically, and it relays that information to clients
     * listening for service worker events.
     *
     * @param notification - The original `Notification` object that was closed.
     * @param action - The action string associated with the close event, if any (usually an empty string).
     */
    async handleClose(notification, action) {
      const options = {};
      NOTIFICATION_OPTION_NAMES.filter((name) => name in notification).forEach((name) => options[name] = notification[name]);
      await this.broadcast({
        type: "NOTIFICATION_CLOSE",
        data: { action, notification: options }
      });
    }
    /**
     * Handles changes to the push subscription by capturing the old and new
     * subscription details and broadcasting a `PUSH_SUBSCRIPTION_CHANGE` message.
     *
     * This method is triggered when the browser invalidates an existing push
     * subscription and creates a new one, which can happen without user interaction.
     * It ensures that clients listening for service worker events are informed
     * of the subscription update.
     *
     * @param event - The `PushSubscriptionChangeEvent` containing the old and new subscriptions.
     */
    async handlePushSubscriptionChange(event) {
      const { oldSubscription, newSubscription } = event;
      await this.broadcast({
        type: "PUSH_SUBSCRIPTION_CHANGE",
        data: { oldSubscription, newSubscription }
      });
    }
    async getLastFocusedMatchingClient(scope2) {
      const windowClients = await scope2.clients.matchAll({ type: "window" });
      return windowClients[0];
    }
    async completeOperation(client, promise, nonce) {
      const response = { type: "OPERATION_COMPLETED", nonce };
      try {
        client.postMessage(__spreadProps(__spreadValues({}, response), {
          result: await promise
        }));
      } catch (e) {
        client.postMessage(__spreadProps(__spreadValues({}, response), {
          error: e.toString()
        }));
      }
    }
    async updateClient(client) {
      const existing = this.clientVersionMap.get(client.id);
      if (existing === this.latestHash) {
        return false;
      }
      let previous = void 0;
      if (existing !== void 0) {
        const existingVersion = this.versions.get(existing);
        previous = this.mergeHashWithAppData(existingVersion.manifest, existing);
      }
      this.clientVersionMap.set(client.id, this.latestHash);
      await this.sync();
      const current = this.versions.get(this.latestHash);
      return true;
    }
    async handleFetch(event) {
      try {
        await this.ensureInitialized(event);
      } catch (e) {
        return this.safeFetch(event.request);
      }
      if (event.request.mode === "navigate" && !this.scheduledNavUpdateCheck) {
        this.scheduledNavUpdateCheck = true;
        this.idle.schedule("check-updates-on-navigation", async () => {
          this.scheduledNavUpdateCheck = false;
          await this.checkForUpdate();
        });
      }
      const appVersion = await this.assignVersion(event);
      const isVersionWithinMaxAge = (appVersion == null ? void 0 : appVersion.manifest.applicationMaxAge) === void 0 || this.adapter.time - appVersion.manifest.timestamp < appVersion.manifest.applicationMaxAge;
      let res = null;
      try {
        if (appVersion !== null && isVersionWithinMaxAge) {
          try {
            res = await appVersion.handleFetch(event.request, event);
          } catch (err) {
            if (err.isUnrecoverableState) {
              await this.notifyClientsAboutUnrecoverableState(appVersion, err.message);
            }
            if (err.isCritical) {
              this.debugger.log(err, `Driver.handleFetch(version: ${appVersion.manifestHash})`);
              await this.versionFailed(appVersion, err);
              return this.safeFetch(event.request);
            }
            throw err;
          }
        }
        if (res === null) {
          return this.safeFetch(event.request);
        }
        return res;
      } finally {
        event.waitUntil(this.idle.trigger());
      }
    }
    /**
     * Attempt to quickly reach a state where it's safe to serve responses.
     */
    async initialize() {
      const table = await this.controlTable;
      let manifests, assignments, latest;
      try {
        [manifests, assignments, latest] = await Promise.all([
          table.read("manifests"),
          table.read("assignments"),
          table.read("latest")
        ]);
        if (!this.versions.has(latest.latest) && !Object.hasOwn(manifests, latest.latest)) {
          this.debugger.log(`Missing manifest for latest version hash ${latest.latest}`, "initialize: read from DB");
          throw new Error(`Missing manifest for latest hash ${latest.latest}`);
        }
        this.idle.schedule("init post-load (update)", async () => {
          await this.checkForUpdate();
        });
      } catch (_) {
        const manifest = await this.fetchLatestManifest();
        const hash = hashManifest(manifest);
        manifests = { [hash]: manifest };
        assignments = {};
        latest = { latest: hash };
        await Promise.all([
          table.write("manifests", manifests),
          table.write("assignments", assignments),
          table.write("latest", latest)
        ]);
      }
      this.idle.schedule("init post-load (cleanup)", async () => {
        await this.cleanupCaches();
      });
      Object.keys(manifests).forEach((hash) => {
        const manifest = manifests[hash];
        if (!this.versions.has(hash)) {
          this.versions.set(hash, new AppVersion(this.scope, this.adapter, this.db, this.idle, this.debugger, manifest, hash));
        }
      });
      Object.keys(assignments).forEach((clientId) => {
        const hash = assignments[clientId];
        if (this.versions.has(hash)) {
          this.clientVersionMap.set(clientId, hash);
        } else {
          this.clientVersionMap.set(clientId, latest.latest);
          this.debugger.log(`Unknown version ${hash} mapped for client ${clientId}, using latest instead`, `initialize: map assignments`);
        }
      });
      this.latestHash = latest.latest;
      if (!this.versions.has(latest.latest)) {
        throw new Error(`Invariant violated (initialize): latest hash ${latest.latest} has no known manifest`);
      }
      await Promise.all(Object.keys(manifests).map(async (hash) => {
        try {
          await this.scheduleInitialization(this.versions.get(hash));
        } catch (err) {
          this.debugger.log(err, `initialize: schedule init of ${hash}`);
        }
      }));
    }
    lookupVersionByHash(hash, debugName = "lookupVersionByHash") {
      if (!this.versions.has(hash)) {
        throw new Error(`Invariant violated (${debugName}): want AppVersion for ${hash} but not loaded`);
      }
      return this.versions.get(hash);
    }
    /**
     * Decide which version of the manifest to use for the event.
     */
    async assignVersion(event) {
      const isWorkerScriptRequest = event.request.destination === "worker" && event.resultingClientId && event.clientId;
      const clientId = isWorkerScriptRequest ? event.clientId : event.resultingClientId || event.clientId;
      if (clientId) {
        if (this.clientVersionMap.has(clientId)) {
          const hash = this.clientVersionMap.get(clientId);
          let appVersion = this.lookupVersionByHash(hash, "assignVersion");
          if (this.state === DriverReadyState.NORMAL && hash !== this.latestHash && appVersion.isNavigationRequest(event.request)) {
            if (this.latestHash === null) {
              throw new Error(`Invariant violated (assignVersion): latestHash was null`);
            }
            const client = await this.scope.clients.get(clientId);
            if (client) {
              await this.updateClient(client);
            }
            appVersion = this.lookupVersionByHash(this.latestHash, "assignVersion");
          }
          if (isWorkerScriptRequest) {
            if (!this.clientVersionMap.has(event.resultingClientId)) {
              this.clientVersionMap.set(event.resultingClientId, hash);
              await this.sync();
            } else if (this.clientVersionMap.get(event.resultingClientId) !== hash) {
              throw new Error(`Version mismatch between worker client ${event.resultingClientId} and requesting client ${clientId}`);
            }
          }
          return appVersion;
        } else {
          if (this.state !== DriverReadyState.NORMAL) {
            return null;
          }
          if (this.latestHash === null) {
            throw new Error(`Invariant violated (assignVersion): latestHash was null`);
          }
          if (isWorkerScriptRequest) {
            if (!this.clientVersionMap.has(event.resultingClientId)) {
              this.clientVersionMap.set(event.resultingClientId, this.latestHash);
            } else if (this.clientVersionMap.get(event.resultingClientId) !== this.latestHash) {
              throw new Error(`Version mismatch between worker client ${event.resultingClientId} and requesting client ${clientId}`);
            }
          }
          this.clientVersionMap.set(clientId, this.latestHash);
          await this.sync();
          return this.lookupVersionByHash(this.latestHash, "assignVersion");
        }
      } else {
        if (this.state !== DriverReadyState.NORMAL) {
          return null;
        }
        if (this.latestHash === null) {
          throw new Error(`Invariant violated (assignVersion): latestHash was null`);
        }
        return this.lookupVersionByHash(this.latestHash, "assignVersion");
      }
    }
    async fetchLatestManifest(ignoreOfflineError = false) {
      const res = await this.safeFetch(this.adapter.newRequest("ngsw.json?ngsw-cache-bust=" + Math.random()));
      if (!res.ok) {
        if (res.status === 404) {
          await this.deleteAllCaches();
          await this.scope.registration.unregister();
        } else if ((res.status === 503 || res.status === 504) && ignoreOfflineError) {
          return null;
        }
        throw new Error(`Manifest fetch failed! (status: ${res.status})`);
      }
      this.lastUpdateCheck = this.adapter.time;
      return res.json();
    }
    async deleteAllCaches() {
      const cacheNames = await this.adapter.caches.keys();
      await Promise.all(cacheNames.map((name) => this.adapter.caches.delete(name)));
    }
    /**
     * Schedule the SW's attempt to reach a fully prefetched state for the given AppVersion
     * when the SW is not busy and has connectivity. This returns a Promise which must be
     * awaited, as under some conditions the AppVersion might be initialized immediately.
     */
    async scheduleInitialization(appVersion) {
      const initialize = async () => {
        try {
          await appVersion.initializeFully();
        } catch (err) {
          this.debugger.log(err, `initializeFully for ${appVersion.manifestHash}`);
          await this.versionFailed(appVersion, err);
        }
      };
      if (isLocalhost(this.scope.registration.scope)) {
        return initialize();
      }
      this.idle.schedule(`initialization(${appVersion.manifestHash})`, initialize);
    }
    async versionFailed(appVersion, err) {
      const broken = Array.from(this.versions.entries()).find(([hash, version]) => version === appVersion);
      if (broken === void 0) {
        return;
      }
      const brokenHash = broken[0];
      if (this.latestHash === brokenHash) {
        this.state = DriverReadyState.EXISTING_CLIENTS_ONLY;
        this.stateMessage = `Degraded due to: ${errorToString(err)}`;
      }
    }
    async setupUpdate(manifest, hash) {
      try {
        const newVersion = new AppVersion(this.scope, this.adapter, this.db, this.idle, this.debugger, manifest, hash);
        if (manifest.configVersion !== SUPPORTED_CONFIG_VERSION) {
          await this.deleteAllCaches();
          await this.scope.registration.unregister();
          throw new Error(`Invalid config version: expected ${SUPPORTED_CONFIG_VERSION}, got ${manifest.configVersion}.`);
        }
        await newVersion.initializeFully(this);
        this.versions.set(hash, newVersion);
        this.latestHash = hash;
        if (this.state === DriverReadyState.EXISTING_CLIENTS_ONLY) {
          this.state = DriverReadyState.NORMAL;
          this.stateMessage = "(nominal)";
        }
        await this.sync();
        await this.notifyClientsAboutVersionReady(manifest, hash);
      } catch (e) {
        await this.notifyClientsAboutVersionInstallationFailed(manifest, hash, e);
        throw e;
      }
    }
    async checkForUpdate() {
      let hash = "(unknown)";
      try {
        const manifest = await this.fetchLatestManifest(true);
        if (manifest === null) {
          this.debugger.log("Check for update aborted. (Client or server offline.)");
          return false;
        }
        hash = hashManifest(manifest);
        if (this.versions.has(hash)) {
          await this.notifyClientsAboutNoNewVersionDetected(manifest, hash);
          return false;
        }
        await this.notifyClientsAboutVersionDetected(manifest, hash);
        await this.setupUpdate(manifest, hash);
        return true;
      } catch (err) {
        this.debugger.log(err, `Error occurred while updating to manifest ${hash}`);
        this.state = DriverReadyState.EXISTING_CLIENTS_ONLY;
        this.stateMessage = `Degraded due to failed initialization: ${errorToString(err)}`;
        return false;
      }
    }
    /**
     * Synchronize the existing state to the underlying database.
     */
    async sync() {
      const table = await this.controlTable;
      const manifests = {};
      this.versions.forEach((version, hash) => {
        manifests[hash] = version.manifest;
      });
      const assignments = {};
      this.clientVersionMap.forEach((hash, clientId) => {
        assignments[clientId] = hash;
      });
      const latest = {
        latest: this.latestHash
      };
      await Promise.all([
        table.write("manifests", manifests),
        table.write("assignments", assignments),
        table.write("latest", latest)
      ]);
    }
    async cleanupCaches() {
      try {
        const activeClients = new Set((await this.scope.clients.matchAll()).map((client) => client.id));
        const knownClients = Array.from(this.clientVersionMap.keys());
        const obsoleteClients = knownClients.filter((id) => !activeClients.has(id));
        obsoleteClients.forEach((id) => this.clientVersionMap.delete(id));
        const usedVersions = new Set(this.clientVersionMap.values());
        const obsoleteVersions = Array.from(this.versions.keys()).filter((version) => !usedVersions.has(version) && version !== this.latestHash);
        obsoleteVersions.forEach((version) => this.versions.delete(version));
        await this.sync();
        const allCaches = await this.adapter.caches.keys();
        const usedCaches = new Set(await this.getCacheNames());
        const cachesToDelete = allCaches.filter((name) => !usedCaches.has(name));
        await Promise.all(cachesToDelete.map((name) => this.adapter.caches.delete(name)));
      } catch (err) {
        this.debugger.log(err, "cleanupCaches");
      }
    }
    /**
     * Determine if a specific version of the given resource is cached anywhere within the SW,
     * and fetch it if so.
     */
    lookupResourceWithHash(url, hash) {
      return Array.from(this.versions.values()).reduce(async (prev, version) => {
        if (await prev !== null) {
          return prev;
        }
        return version.lookupResourceWithHash(url, hash);
      }, Promise.resolve(null));
    }
    async lookupResourceWithoutHash(url) {
      await this.initialized;
      const version = this.versions.get(this.latestHash);
      return version ? version.lookupResourceWithoutHash(url) : null;
    }
    async previouslyCachedResources() {
      await this.initialized;
      const version = this.versions.get(this.latestHash);
      return version ? version.previouslyCachedResources() : [];
    }
    async recentCacheStatus(url) {
      const version = this.versions.get(this.latestHash);
      return version ? version.recentCacheStatus(url) : UpdateCacheStatus.NOT_CACHED;
    }
    mergeHashWithAppData(manifest, hash) {
      return {
        hash,
        appData: manifest.appData
      };
    }
    async notifyClientsAboutUnrecoverableState(appVersion, reason) {
      const broken = Array.from(this.versions.entries()).find(([hash, version]) => version === appVersion);
      if (broken === void 0) {
        return;
      }
      const brokenHash = broken[0];
      const affectedClients = Array.from(this.clientVersionMap.entries()).filter(([clientId, hash]) => hash === brokenHash).map(([clientId]) => clientId);
      await Promise.all(affectedClients.map(async (clientId) => {
        const client = await this.scope.clients.get(clientId);
        if (client) {
          client.postMessage({ type: "UNRECOVERABLE_STATE", reason });
        }
      }));
    }
    async notifyClientsAboutVersionInstallationFailed(manifest, hash, error) {
      await this.initialized;
      const clients = await this.scope.clients.matchAll();
      await Promise.all(clients.map(async (client) => {
        client.postMessage({
          type: "VERSION_INSTALLATION_FAILED",
          version: this.mergeHashWithAppData(manifest, hash),
          error: errorToString(error)
        });
      }));
    }
    async notifyClientsAboutNoNewVersionDetected(manifest, hash) {
      await this.initialized;
      const clients = await this.scope.clients.matchAll();
      await Promise.all(clients.map(async (client) => {
        client.postMessage({
          type: "NO_NEW_VERSION_DETECTED",
          version: this.mergeHashWithAppData(manifest, hash)
        });
      }));
    }
    async notifyClientsAboutVersionDetected(manifest, hash) {
      await this.initialized;
      const clients = await this.scope.clients.matchAll();
      await Promise.all(clients.map(async (client) => {
        const version = this.clientVersionMap.get(client.id);
        if (version === void 0) {
          return;
        }
        client.postMessage({
          type: "VERSION_DETECTED",
          version: this.mergeHashWithAppData(manifest, hash)
        });
      }));
    }
    async notifyClientsAboutVersionReady(manifest, hash) {
      await this.initialized;
      const clients = await this.scope.clients.matchAll();
      await Promise.all(clients.map(async (client) => {
        const version = this.clientVersionMap.get(client.id);
        if (version === void 0) {
          return;
        }
        if (version === this.latestHash) {
          return;
        }
        const current = this.versions.get(version);
        const notice = {
          type: "VERSION_READY",
          currentVersion: this.mergeHashWithAppData(current.manifest, version),
          latestVersion: this.mergeHashWithAppData(manifest, hash)
        };
        client.postMessage(notice);
      }));
    }
    async broadcast(msg) {
      const clients = await this.scope.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage(msg);
      });
    }
    async debugState() {
      return {
        state: DriverReadyState[this.state],
        why: this.stateMessage,
        latestHash: this.latestHash,
        lastUpdateCheck: this.lastUpdateCheck
      };
    }
    async debugVersions() {
      return Array.from(this.versions.keys()).map((hash) => {
        const version = this.versions.get(hash);
        const clients = Array.from(this.clientVersionMap.entries()).filter(([clientId, version2]) => version2 === hash).map(([clientId, version2]) => clientId);
        return {
          hash,
          manifest: version.manifest,
          clients,
          status: ""
        };
      });
    }
    async debugIdleState() {
      return {
        queue: this.idle.taskDescriptions,
        lastTrigger: this.idle.lastTrigger,
        lastRun: this.idle.lastRun
      };
    }
    async safeFetch(req) {
      try {
        return await this.scope.fetch(req);
      } catch (err) {
        this.debugger.log(err, `Driver.fetch(${req.url})`);
        return this.adapter.newResponse(null, {
          status: 504,
          statusText: "Gateway Timeout"
        });
      }
    }
    async getCacheNames() {
      const controlTable = await this.controlTable;
      const appVersions = Array.from(this.versions.values());
      const appVersionCacheNames = await Promise.all(appVersions.map((version) => version.getCacheNames()));
      return [controlTable.cacheName].concat(...appVersionCacheNames);
    }
  };

  // packages/service-worker/worker/main.ts
  var scope = self;
  var adapter = new Adapter(scope.registration.scope, self.caches);
  new Driver(scope, adapter, new CacheDatabase(adapter));
})();
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
