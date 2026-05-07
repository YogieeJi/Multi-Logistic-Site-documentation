
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Sidebar } from 'primereact/sidebar';
import { Timeline } from 'primereact/timeline';
import { GeneralService } from '../../../../service/inbound/GeneralService';
import { Dialog } from 'primereact/dialog';
import { ProductService } from '../../../../service/products/ProductService';
import { TabView, TabPanel } from 'primereact/tabview';
import { BoxAdditionService } from '../../../../service/products/BoxAdditionService';

export default function BoxAdditionDetails() {
    const [boxAdditionDetail, setBoxAdditionDetail] = useState({});


    const [statusValue, setStatusValue] = useState(null);

    const [visibleRight, setVisibleRight] = useState(false);
    
    const navigate = useNavigate();

    const [boxAdditionId, setBoxAdditionId] = useState(0);

   

    const [logs, setLogs] = useState(null);
    const [visible, setVisible] = useState(false);
    const [dialogText, setDialogText] = useState('');

    const getSeverity = (status) => {
        switch (status) {
            case 1:
                return 'info';

            case 2:
                return 'warning';

            case 3:
                return 'success';
        }
    };

    const reactRouterLink = (label, url) => {
        return (<Link to={url}>{label}</Link>);
    }



    let networkTimeout = null;
    const params = useParams();

 

    useEffect(() => {
        getDetails();
    }, []);



    const getDetails = () => {
        BoxAdditionService.getBoxAdditionDetail(params.id).then((data) => {
            setBoxAdditionDetail(data.data);
            setBoxAdditionId(boxAdditionDetail.id)
        });
    };


    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Box Addition Info</h3>
                <div className='page-headerActions' style={{ display: "flex", gap: 30, alignItems: 'center' }}>
                    <Button label="Edit" icon="fa fa-solid fa-pen-to-square" severity="sucess" onClick={() => navigate("/products/box-addition/edit/"+boxAdditionDetail.id)} />                
                </div>
            </div>
            <h1></h1>

            
            <div className="grid">
                <div className="col-12">
                   





                    <div className="card">
                        <h4>Box Addition Info</h4>
                        <br/>
                        <div className="p-fluid formgrid grid">
                            <div className="field col-12 md:col-4">
                                <h5 id="item_sku">Item SKU</h5>
                                <p htmlFor="item_sku">{boxAdditionDetail.item_code || '-'}</p>

                            </div>
                            <div className="field col-12 md:col-4">
                                <h5 id="box_sku">Box SKU</h5>
                                <p htmlFor="box_sku">{boxAdditionDetail.box_sku || '-'}</p>

                            </div>
                            <div className="field col-12 md:col-4">
                                <h5 id="box_uom">Box UOM</h5>
                                <p htmlFor="box_uom">{boxAdditionDetail.box_uom || '-'}</p>

                            </div>
                            <div className="field col-12 md:col-4">
                                <h5 id="box_upc">Box UPC</h5>
                                <p htmlFor="box_upc">{boxAdditionDetail.box_upc || '-'}</p>

                            </div>

                          

                            <div className="field col-12 md:col-4">
                                <h5 id="box_units">Box Units</h5>
                                <p htmlFor="box_units">{boxAdditionDetail.box_units || '-'}</p>

                            </div>

                        
                            
                          
                           
                            
                        </div>
                    </div>
              
                        
                </div>
                
            </div>
        </>

    );
}
