import React from 'react'
import './DescriptionBox.css'

const DescriptionBox = () => {
    return (
        <div className='descriptionbox'>
            <div className="descriptionbox-navigator">
                <div className="descriptionbox-nav-box">Description</div>
                <div className="descriptionbox-nav-box fade">Reviews(122)</div>
            </div>
            <div className="descriptionbox-description">
                <p>An e-commerce is an online platform that facilates the buying and selling of product or services over the internet. It servs as a virtual marketplace where businesses and individual ca showcase their products, interact with customers and conduct transations without the need for a physical presence. E-commerce website have gained immerse popularity due to their convenience, accessibility and the global reach they offer</p>
                <p>
                    E-commerce website typically display products of services along with detailed description, images, prices, and any available variation (e.g sizes, colours). Each product usually has its own dedicated page with relevant information
                </p>
            </div>
        </div>
    )
}

export default DescriptionBox