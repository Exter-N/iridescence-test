import Stats from 'stats.js';

const stats = new Stats();
stats.dom.classList.add('stats');

let visible = false;
export function show() {
    if (!visible) {
        visible = true;
        document.body.appendChild(stats.dom);
    }
}

export default stats;