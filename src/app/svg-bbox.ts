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
    return result;
}
