import React, { useEffect } from 'react';
import { useUser } from '../../UserContext'; 

function UnauthorizedPage() {
  // const { userDetails } = useUser(); 

  // useEffect(() => {
  //   console.log("User details from context:", userDetails);
  // }, [userDetails]);

  // const roles = {
  //   0n: "Factory",
  //   1n: "PBF", 
  //   2n: "BPOM",
  //   3n: "Retailer",
  //   4n: "Guest"
  // }

  const userdata = JSON.parse(sessionStorage.getItem('userdata'));
  console.log(userdata)

  return (
    <div>
      <h2>Whoops, 401 Error</h2>
      <p>You do not have permission to access this page.</p>
    </div>
  );
}

export default UnauthorizedPage;