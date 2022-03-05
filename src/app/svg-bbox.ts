
function round(val: number) : number{
    return Math.round(val * 1e5) / 1e5;
}

export function browserComputePathBoundingBox(path: string): DOMRect {
    const svgNS = 'http://www.w3.org/2000/svg';
    const svgEl = document.createElementNS(svgNS, 'svg');
    svgEl.style.position = 'absolute';
    svgEl.style.width = '0px';
    svgEl.style.height = '0px';
    const pathEl = document.createElementNS(svgNS, 'path');
    pathEl.setAttributeNS(null, 'd', path);
    svgEl.appendChild(pathEl);
    document.body.appendChild(svgEl);
    const result = pathEl.getBBox();
    svgEl.remove();
    result.x = round(result.x);
    result.y = round(result.y);
    result.width = round(result.width);
    result.height = round(result.height);
    return result;
}
