import React, { useEffect } from 'react';
import { useUser } from '../../UserContext'; 
import imgUnauthor from '../../assets/images/unauthorize.png';
import "../../styles/Error.scss"

function UnauthorizedPage() {
  
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  console.log(userdata);

  useEffect(() => {
    document.title = "Unauthorized!"; 
  }, []);

  return (
    <>
      <div className="layout-page">
        <div className="container">
          <h1>Hold Up!</h1>          
          <img src={imgUnauthor} alt="" />
          <p>It look's like you're trying to sneak into a restricted area. &#128373;</p>
        </div>
      </div>
    </>
  );
}

export default UnauthorizedPage;