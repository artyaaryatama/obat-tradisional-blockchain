import React, { useEffect } from 'react';
import { useUser } from '../../UserContext'; 
import imgError from '../../assets/images/error.png';
import "../../styles/Error.scss"

function ErrorPage() {
  
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  console.log(userdata)

  return (
    <>
      <div className="layout-page">
        <div className="container">
          <h1>Uh-oh, looks like we hit a snag!</h1>          
          <img src={imgError} alt="" />
          <p>Something didn't go as  planned. But don't worry, it's  probably just a glitch in the matrix. &#129302;</p>
        </div>
      </div>
    </>
  );
}

export default ErrorPage;