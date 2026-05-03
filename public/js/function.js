let cart = document.querySelector(".viewoption");
let btn = document.getElementById("a02");
btn.addEventListener("click",()=>{
    console.log("clicked");
    
    let current_right = window.getComputedStyle(cart).right;
    if(window.getComputedStyle(cart).right == "-400px"){
        cart.style.right = "0px";
    }else{
        cart.style.right = "-400px";
    }
    console.log(window.getComputedStyle(cart).right);
    
})

//craeting a delay function which return a promise after some delay
async function delay(ms){
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, ms);
    })
}

async function main() {
    
    let element = document.querySelector('.add-btn');
    element.addEventListener("click",async()=>{
        console.log("waited for 4 second");
        let cart = document.querySelector('.cart-bar');
        cart.style.visibility = 'visible';
        cart.style.opacity = '1';
        await delay(1000);
        cart.style.visibility = 'hidden' ;
        cart.style.opacity = '0';

    })
    
    
}

main()