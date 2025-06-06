import React, { useEffect } from 'react';
import imgUnauthor from '../../assets/images/unauthorize.png';
import "../../styles/Error.scss"

function UnauthorizedPage() {
  
  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  console.log(userdata);

  useEffect(() => {
    document.title = "Maaf, akses terbatas!"; 
  }, []);

  return (
    <>
      <div className="layout-page">
        <div className="container">
          <h1>Maaf, Kamu Tidak Memiliki Akses!</h1>          
          <img src={imgUnauthor} alt="" />
          <p>Sepertinya kamu mencoba mengakses area yang terbatas. Silahkan kembali ke halaman sebelumnya. &#128373;</p>
        </div>
      </div>
    </>
  );
}

export default UnauthorizedPage;