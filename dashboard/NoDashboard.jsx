// import React from 'react';

// import DashboardMenu from './DashboardMenu';
// import { useNavigate } from 'react-router-dom';


// const NoDashboard = (props) => {
//     const navigate = useNavigate();
//     const storedData = JSON.parse(localStorage.getItem('user'));
   
//     if(storedData){
//         if(storedData.user.user_role_id == 0){
//             navigate("/conveyor-dashboard")
//         }else{
//             const userPermissions = storedData.user.user_role.user_permissions;
//             const keys = Object.keys(userPermissions.selectedKeys);
//                 if(keys.includes("order_dashboard")){
//                     navigate("/order-dashboard");
//                 }else if(keys.includes("conveyor_dashboard")){
//                     navigate("/conveyor-dashboard");
//                 }else if(keys.includes("services_dashboard")){
//                     navigate("/services-dashboard");
//                 }else if(keys.includes("truck_dashboard")){
//                     navigate("/truck-dashboard");
//                 }else if(keys.includes("user_task_dashboard")){
//                     navigate("/user-task-dashboard");   
//                 }
                
             
//         }
//     }
    
    
         
//     return (
//         <>
//             <div class="flex  gap-3 pt-5">
//             <h1>This user has not been granted permission to access the dashboard.</h1>
//             </div>
         
            
           
        
         
//         </>
//     );
// }

// const comparisonFn = function (prevProps, nextProps) {
//     return (prevProps.location.pathname === nextProps.location.pathname) && (prevProps.colorMode === nextProps.colorMode);
// };

// export default React.memo(NoDashboard, comparisonFn);


import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
 
const NoDashboard = (props) => {
  const navigate = useNavigate();
  const hasRedirected = useRef(false);
 
  useEffect(() => {
    if (hasRedirected.current) return;
    const storedData = JSON.parse(localStorage.getItem('user'));
    if (!storedData) return;
 
    // const keys = Object.keys(storedData.user.user_role.user_permissions?.selectedKeys || {});
const keys = storedData.user.actionPermissions
    ?.filter(p => p.permission?.view?.allowed === true)
    .map(p => p.page_key) || [];
 
    if (storedData.user.user_role_id === 0) {
      navigate("/conveyor-dashboard");
      hasRedirected.current = true;
    } else if (keys.includes("order_dashboard")) {
      navigate("/order-dashboard");
      hasRedirected.current = true;
    } else if (keys.includes("conveyor_dashboard")) {
      navigate("/conveyor-dashboard");
      hasRedirected.current = true;
    } else if (keys.includes("services_dashboard")) {
      navigate("/services-dashboard");
      hasRedirected.current = true;
    } else if (keys.includes("truck_dashboard")) {
      navigate("/truck-dashboard");
      hasRedirected.current = true;
    } else if (keys.includes("user_task_dashboard_tab")) {
      navigate("/user-task-dashboard");
      hasRedirected.current = true;
    }
  }, [navigate]);
 
  return (
    <div className="flex gap-3 pt-5">
      <h1>This user has not been granted permission to access the dashboard.</h1>
    </div>
  );
};
 
const comparisonFn = (prevProps, nextProps) => {
  const prevPath = prevProps.location?.pathname;
  const nextPath = nextProps.location?.pathname;
  return prevPath === nextPath && prevProps.colorMode === nextProps.colorMode;
};
 
export default React.memo(NoDashboard, comparisonFn);