import React, { useState, useEffect, useRef , Component } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import DashboardMenu from './DashboardMenu';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Menu } from 'primereact/menu';  
import { DashboardService } from '../../service/DashboardService';
import '../../assets/styles.css';
import ConnectedImg from '../../assets/connected-plug-icon.png';
import DisConnectedImg from '../../assets/disconnect-plug-icon.png';
import { Card } from 'primereact/card';


const OrdersDashboard = (props) => {
  const menuLeft = useRef(null);  
  const [loading, setLoading] = useState(true);
   
    const [displayConfirmation14, setDisplayConfirmation14] = useState(false);
   
    const toast = useRef();
    
  
    const title = (
        <div class="flex justify-content-between flex-wrap">
             <div class="flex align-items-center justify-content-center">Conveyor Service</div>
             <div class="flex align-items-center justify-content-center">
                <i class="fa-solid fa-circle" style={{color: "#229e3b"}}></i> 
            </div>
            
        </div>
    );
    const title2 = (
        <div class="flex justify-content-between flex-wrap">
             <div class="flex align-items-center justify-content-center">Mantis API</div>
             <div class="flex align-items-center justify-content-center">
                <i class="fa-solid fa-circle" style={{color: "#F44336"}}></i> 
            </div>
            
        </div>
    );
    const title3 = (
        <div class="flex justify-content-between flex-wrap">
             <div class="flex align-items-center justify-content-center">PTL HW</div>
             <div class="flex align-items-center justify-content-center">
                <i class="fa-solid fa-circle" style={{color: "#229e3b"}}></i> 
            </div>
            
        </div>
    );
    const title4 = (
        <div class="flex justify-content-between flex-wrap">
             <div class="flex align-items-center justify-content-center">Central Server</div>
             <div class="flex align-items-center justify-content-center">
                <i class="fa-solid fa-circle" style={{color: "#229e3b"}}></i> 
            </div>
            
        </div>
    );
    const Refresh=()=>{
        
    }
    return (
        <>
        
        
     
         <div class="flex flex-row-reverse flex-wrap">
                <div class="flex align-items-center justify-content-center">
                <Button 
                label="Refresh" 
                loading={loading} 
                onClick={Refresh} 
                severity="success" 
                icon="pi pi-refresh" 
                className="align-item-right"
                size="small" 
            />
                </div>
                
            </div>
       
       
        
        
         <div class="flex  gap-3">
            <Card title={title} subTitle="Last Checked: 10-24-2024 5:11 PM"  className="md:w-25rem">
                <p className="m-0">
                <img alt="flag" src={ConnectedImg}   style={{ width: '250px',height: '240px' }} />
                </p>
            </Card>
            <Card title={title2} subTitle="Last Checked: 10-24-2024 5:11 PM"  className="md:w-25rem">
                <p className="m-0">
                <img alt="flag" src={DisConnectedImg}   style={{ width: '250px',height: '240px' }} />
                </p>
            </Card>
            <Card title={title3} subTitle="Last Checked: 10-24-2024 5:11 PM"  className="md:w-25rem">
                <p className="m-0">
                <img alt="flag" src={ConnectedImg}   style={{ width: '250px',height: '240px' }} />
                </p>
            </Card>
            <Card title={title4} subTitle="Last Checked: 10-24-2024 5:11 PM"  className="md:w-25rem">
                <p className="m-0">
                <img alt="flag" src={ConnectedImg}   style={{ width: '250px',height: '240px' }} />
                </p>
            </Card>
        </div>
         
            
           
        
         
        </>
    );
}

const comparisonFn = function (prevProps, nextProps) {
    return (prevProps.location.pathname === nextProps.location.pathname) && (prevProps.colorMode === nextProps.colorMode);
};

export default React.memo(OrdersDashboard, comparisonFn);
