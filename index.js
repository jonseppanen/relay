import { Relay, Component } from '/Relay.js'

window.R = new Relay(document.getElementById("Relay"));

R.temptest = Component('cardExample.html', '{{anchor5}}');
R.deep = {}
R.deep.shit = "gg"
R.anchor1 = 'prestring<div>anchor1{{deepclass}}</div>'
R.anchor2 = 'anchor2<div>{{deep.shit}}</div>'
R.anchor3 = '<div><h2>anchor3{{deepclass}}</h2></div>'
R.anchor4 = '<div>anchor4{{deepclass}}</div>'
R.anchor5 = '<div>anchor5{{newdeeptest}}</div>'
R.anchor6 = '<div>anchor6</div>'
R.anchor7 = '<div>anchor7{{deep.shit}}</div>'
R.deepclass = 'fucky'
R.class1 = 'notfucky'
R.newdeeptest = '<div>cascade{{newdeeptest2}}</div>'
R.newdeeptest2 = ' to here';


window.gg = () => {
    R.deepclass = 'hnggggggg';
    R.anchor5 = `<div>
    <style>
        div{
            background:#0F0;
        }
        .testspan{
            color:#00F;
        }
    </style>
    <div>This is testing shadow root <span class='testspan'>with a test span</span> {{anchor7}}</div></div>
    `
}

window.gg2 = () => {
    R.deepclass = 'hnggggggg';
    R.anchor5 = `<div>shadowgone!</div>`
}
window.gg3 = () => {
    return [
        Component('cardExample.html', '{{anchor5}}'),
        'interstitial',
        Component('cardExample.html', '{{anchor5}}')
    ];
}

window.gg4 = () => {
    R.anchor1.push(Component('cardExample.html', 'FUCK'));
    //return Component('cardExample.html', '{{anchor5}}')
}


window.gg5 = () => {
    R.anchor1[2] = Component('cardExample.html', 'SHIT');
    //return Component('cardExample.html', '{{anchor5}}')
}

