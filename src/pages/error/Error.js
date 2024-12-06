import React, { useEffect } from 'react';
import imgError from '../../assets/images/error.png';
import "../../styles/Error.scss"

function ErrorPage() {
  
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  console.log(userdata);

  useEffect(() => {
    document.title = "Oops! Error."; 
  }, []);

  return (
    <>
      <div className="layout-page">
        <div className="container">
          <h1>Page Under Development</h1>          
          <img src={imgError} alt="" />
          <p>We're currently working on this page. Stay tuned for updates, it will be ready soon! &#129302;</p>
        </div>
      </div>
    </>
  );
}

export default ErrorPage;