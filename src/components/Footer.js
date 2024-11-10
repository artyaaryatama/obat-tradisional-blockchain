import React from "react";

import "../styles/Footer.scss"

function Footer(){

  return (
    <>
      <div className="layout-page">
        <footer>
          {/* <h1>Developed by, Artia Audrian Aryatama.</h1> */}

          <div className="project-intro">
            <p>Thesis Project: </p>
            <span>PENERAPAN BLOCKCHAIN DENGAN ALGORITMA PROOF OF  STAKE SEBAGAI 
            SISTEM ANTI-PEMALSUAN DALAM RANTAI  PASOK OBAT TRADISIONAL</span>
          </div>

          <span className="attribute">
            Illustration(s) from <a href="https://absurd.design/">absurd.design</a>
          </span>

          <p className="motto">
          それでも一歩 踏み出した君へ
          </p>
        </footer>
      </div>
    </>
  );
}

export default Footer;