let ancestry = new WeakMap();
let registry = [];
const bigote = /\{\{([^\{\{\}\}]+)\}\}/g;


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
    shellWorker.innerHTML = outerShell.outerHTML.slice(0).replace(bigote, (match, variable) => variable.split('.').reduce((o, i) => o[i], s) || '');
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
                    let value = variable.split('.').reduce((o, i) => o[i], s) || '';
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
                newString += '<span class="safireTarget">' + child.outerHTML.slice(0) + '</span>';
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
        if(!watched.includes(variable)) watched.push(variable);
        let value = variable.split('.').reduce((o, i) => o[i], s) || '';
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
        var p = (Math.random().toString(16)+"000000000").substr(2,8);
        return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
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

        for (let newSpark of newNode.querySelectorAll('.safireTarget')) {
            if (newSpark.children.length === 1) {
                usurp(newSpark, s.register(newSpark.firstChild))
            }
            else {
                console.log('fucky wucky!');
                console.log(newSpark);
            }
        }

        this.node = usurp(this.node, newNode)
    }
}

const interceptor = {
    set: function set(target, property, value) {
        target[property] = inquisitor(target, property, value);

        let pathString = ''
        let ancestor = ancestry.get(target);
        while (ancestor.keyname) {
            pathString += ancestor.keyname + '.';
            ancestor = ancestor.parent;
        }
        pathString += property;
        registry.filter(sNode => sNode.watched.includes(pathString)).forEach(sNode => sNode.update());
        registry = registry.filter(sNode => document.getElementById("Safire").contains(sNode.node));
        console.log(registry);
        return true;
    },
    get: function get(target, property) {
        return Reflect.get(target, property)
    }
};

const inquisitor = (target, property, value) => {
    if (Array.isArray(value) || typeof value === "object") {
        let newP = new Proxy(value, interceptor);
        ancestry.set(value, { parent: target, keyname: property });
        return newP;
    }
    return value;
}

class Safire {
    constructor() {
        const data = {
            register: function register(el) {
                const sNode = new Spark(el);
                registry.push(sNode);
                return sNode.node;
            }

        }
        const proxy = new Proxy(data, {
            set: function set(target, property, value) {
                target[property] = inquisitor(target, property, value);
                registry.filter(sNode => sNode.watched.includes(property)).forEach(sNode => sNode.update());
                registry = registry.filter(sNode => document.getElementById("Safire").contains(sNode.node));
                console.log(registry);
                return true

            }
        })

        return proxy
    }
}

const s = new Safire()

s.anchor1 = 'prestring<div>anchor1{{deepclass}}</div>'
s.anchor2 = 'anchor2<div>{{deep.shit}}</div>'
s.anchor3 = '<div><h2>anchor3{{deepclass}}</h2></div>'
s.anchor4 = '<div>anchor4{{deepclass}}</div>'
s.anchor5 = '<div>anchor5</div>'
s.anchor6 = '<div>anchor6</div>'
s.anchor7 = '<div>anchor7{{deep.shit}}</div>'
s.deepclass = 'fucky'
s.class1 = 'notfucky'
s.deep = {}
s.deep.shit = "gg"

s.register(document.getElementById("Safire"));
registry = registry.filter(sNode => document.getElementById("Safire").contains(sNode.node));


