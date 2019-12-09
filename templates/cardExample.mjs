export default (tempvar1) => {
    return `
    <div class='tester'>
    
    <style>
        div{
            border:3px dotted #888;
            border-radius:16px;
            padding:32px;
            display:inline-block;
        }
    </style>

    <div class="main">
        This is a card test with ${tempvar1}
    </div>
    
    </div>
    `
}
