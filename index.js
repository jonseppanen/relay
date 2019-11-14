

const usurp = (replaced, replacer) => {
    replaced.parentNode.insertBefore(replacer, replaced.nextSibling);
    replaced.remove();
    return replacer;
}

const templateOuterHTML = (node) => {
    let domfrag = document.createDocumentFragment();
    let shellWorker = document.createElement('div');
    domfrag.appendChild(shellWorker);
    let outerShell = node.cloneNode();
    shellWorker.innerHTML = outerShell.outerHTML.slice(0).replace(bigote, (match, variable) => variable.split('.').reduce((o, i) => o[i], R) || '');
    return shellWorker.firstElementChild;
}

const splitter = (htmlString) => {
    let domfrag = document.createDocumentFragment();
    let newNode = document.createElement('div');
    domfrag.appendChild(newNode);
    newNode.innerHTML = htmlString;
    let newString = '';
    for (let child of newNode.childNodes) {
        if (child.nodeValue) {
            if (child.nodeValue.includes('{{')) {
                newString += child.nodeValue.slice(0).replace(bigote, (match, variable) => {
                    let value = variable.split('.').reduce((o, i) => o[i], R) || '';
                    if (value.includes("<")) {
                        return splitter(value);
                    }
                    else {
                        return value;
                    }
                });
            }
            else {
                newString += child.nodeValue;
            }
        }
        else {
            if (child.outerHTML.includes('{{')) {
                newString += '<span class="RelayTarget">' + child.outerHTML.slice(0) + '</span>';
            }
            else {
                newString += child.outerHTML;
            }
        }
    }

    return newString;

}

const indoctrinate = (node, watched) => {
    let domfrag = document.createDocumentFragment();
    let newNode = templateOuterHTML(node);
    domfrag.appendChild(newNode);



    newNode.innerHTML = node.innerHTML.slice(0).replace(bigote, (match, variable) => {
        if (!watched.includes(variable)) watched.push(variable);
        let value = variable.split('.').reduce((o, i) => o[i], R) || '';
        if (value.includes("<") || value.includes("{{")) {
            return splitter(value);
        }
        else {
            return value;
        }
    });

    return newNode;
}

function guid() {
    function _p8(s) {
        var p = (Math.random().toString(16) + "000000000").substr(2, 8);
        return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
    }
    return _p8() + _p8(true) + _p8(true) + _p8();
}

class Spark {
    constructor(node) {
        this.node = node;
        this.template = node.cloneNode(true);
        this.watched = [];
        this.id = guid();
        this.update(true);
    }

    update = (firstRun = false) => {

        let domfrag = document.createDocumentFragment();
        let newNode = indoctrinate(this.template, this.watched)
        domfrag.appendChild(newNode);

        for (let newSpark of newNode.querySelectorAll('.RelayTarget')) {
            if (newSpark.children.length === 1) {
                usurp(newSpark, R.register(newSpark.firstChild))
            }
            else {
                console.log('fucky wucky!');
                console.log(newSpark);
            }
        }

        this.node = usurp(this.node, newNode)
    }
}

const getDotPath = (target, property) => {
    let pathString = ''
    let ancestor = ancestry.get(target);
    if (!ancestor) return property;
    while (ancestor.keyname) {
        pathString += ancestor.keyname + '.';
        ancestor = ancestor.parent;
    }
    pathString += property;
    return pathString
}

const updateWatchers = (target, property) => {
    registry.filter(sNode => sNode.watched.includes(getDotPath(target, property))).forEach(sNode => sNode.update());
    registry = registry.filter(sNode => document.getElementById("Relay").contains(sNode.node));
    console.log(registry);
}

const interceptor = {
    set: function set(target, property, value) {
        target[property] = inquisitor(target, property, value);
        updateWatchers(target, property);
        return true;
    }
};

const inquisitor = (target, property, value) => {
    if (Array.isArray(value) || typeof value === "object") {
        ancestry.set(value, { parent: target, keyname: property });
        return new Proxy(value, interceptor);
    }
    return value;
}

let ancestry = new WeakMap();
let registry = [];
const bigote = /\{\{([^\{\{\}\}]+)\}\}/g;

class Relay {
    constructor() {
        const data = {
            register: function register(el) {
                const sNode = new Spark(el);
                registry.push(sNode);
                return sNode.node;
            }
        }
        return new Proxy(data, interceptor)
    }
}

const R = new Relay()

R.anchor1 = 'prestring<div>anchor1{{deepclass}}</div>'
R.anchor2 = 'anchor2<div>{{deep.shit}}</div>'
R.anchor3 = '<div><h2>anchor3{{deepclass}}</h2></div>'
R.anchor4 = '<div>anchor4{{deepclass}}</div>'
R.anchor5 = '<div>anchor5</div>'
R.anchor6 = '<div>anchor6</div>'
R.anchor7 = '<div>anchor7{{deep.shit}}</div>'
R.deepclass = 'fucky'
R.class1 = 'notfucky'
R.deep = {}
R.deep.shit = "gg"

R.register(document.getElementById("Relay"));


