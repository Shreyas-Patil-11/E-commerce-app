import React, { createContext, useEffect, useState } from 'react'
// import all_product from '../Components/Assets/all_product'

export const ShopContext = createContext(null);

const getDefaultCart = () =>{
    let cart = {};
    for (let index = 0; index < 300+1; index++) {
        cart[index] = 0;
    }
    return cart;
}

const ShopContextProvider = (props) => {

    const [all_product, setAll_Product] = useState([])
    const [cartItems, setCartItems] = useState(getDefaultCart());

    useEffect(()=>{
        fetch(`${process.env.SERVER_URL}/allproducts`)
        .then((response)=> response.json())
        .then((data) => setAll_Product(data))

        if(localStorage.getItem('auth-token')){
            fetch(`${process.env.SERVER_URL}/getcart`, {
                method: 'POST',
                headers: {
                    Accept: 'application/form-data',
                    'auth-token': `${localStorage.getItem('auth-token')}`,
                    'Content-Type': 'application/json',
                },
                body: null,
            }).then((response)=> response.json())
            .then((data) => setCartItems(data));
        }
    },[])
    
    const addToCart = (itemId) => {
        // setCartItems((prev) => ({...prev, [itemId]:prev[itemId]+1}))
        setCartItems((prev) => {
            const updatedCart = { ...prev };
            updatedCart[itemId] = (updatedCart[itemId] || 0) + 1;
            return updatedCart;
        });
    
        if(localStorage.getItem('auth-token')){
            fetch(`${process.env.SERVER_URL}/addtocart`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/form-data',
                    'auth-token': `${localStorage.getItem('auth-token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({'itemID': itemId})
            }).then((response)=> response.json())
              .then((data) => console.log(data))
        }
    }   
    
    const removeFromCart = (itemId) => {
        // setCartItems((prev) => ({...prev, [itemId]:prev[itemId]-1}))
        setCartItems((prev) => {
            const updatedCart = { ...prev };
            if (updatedCart[itemId] > 0) {
                updatedCart[itemId] -= 1;
            }
            return updatedCart;
        });
        if(localStorage.getItem('auth-token')){
            fetch(`${process.env.SERVER_URL}/removefromcart`, {
                method: 'POST',
                headers: {
                    Accept: 'application/form-data',
                    'auth-token': `${localStorage.getItem('auth-token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({'itemID': itemId})
            }).then((response)=> response.json())
              .then((data) => console.log(data))
        }
    }

    const getTotalCartAmount = ()=>{
        let totalAmount = 0;
        for(const item in cartItems){
            if(cartItems[item]>0){
                let itemInfo = all_product.find((product)=> product.id=== Number(item));
                totalAmount += itemInfo.new_price * cartItems[item];
            }
        }
        return totalAmount;
    }

    const getTotalCartItem = () => {
        let totalItem = 0;
        for(const item in cartItems){
            if (cartItems[item]>0) {
                totalItem += cartItems[item];
            }
        }
        return totalItem;
    }

    const contextValue = {getTotalCartItem, getTotalCartAmount, all_product, cartItems, addToCart, removeFromCart};

    return(
        <ShopContext.Provider value={contextValue} >
            {props.children}
        </ShopContext.Provider>
    )
}

export default ShopContextProvider;