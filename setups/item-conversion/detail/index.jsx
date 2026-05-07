
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { ItemConversionService } from '../../../../service/setups/ItemConversionService';
import { useAuth } from '../../../../store/useAuth';


export default function ItemConversionDetails() {
    const {hasActionAccess} = useAuth();
            const PAGE_KEY = "setups_itemConversion_details"
    const [itemDetail, setItemDetail] = useState({});
    const navigate = useNavigate();
    const params = useParams();

    useEffect(() => {
        getDetails();
    }, []);



    const getDetails = () => {
        ItemConversionService.getItemDetail(params.id).then((data) => {
            setItemDetail(data.data[0]);
        });
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Item Conversion</h3>
                <div className='page-headerActions' style={{ display: "flex", gap: 30, alignItems: 'center' }}>
                    {hasActionAccess(PAGE_KEY, "edit") &&(<Button label="Edit" icon="fa fa-solid fa-pen-to-square" severity="sucess" onClick={() => navigate("/setup/item-conversion/edit/"+itemDetail.sku_mantis)} /> )}               
                </div>
            </div>
            <h1></h1>

            
          


            <div className="grid">
                <div className="col-12">
                   
                    <div className="card">
                        <div className="p-fluid formgrid grid">
                            <div className="field col-12 md:col-6">
                                <h5 id="sku_x3">Sku X3</h5>
                                <p htmlFor="sku_x3">{itemDetail?.sku_x3 || '-'}</p>

                            </div>
                            <div className="field col-12 md:col-6">
                                <h5 id="sku_mantis">Sku Mantis</h5>
                                <p htmlFor="sku_mantis">{itemDetail?.sku_mantis || '-'}</p>

                            </div>
                            <div className="field col-12 md:col-6">
                                <h5 id="uom_x3">Uom X3</h5>
                                <p htmlFor="uom_x3">{itemDetail?.uom_x3 || '-'}</p>

                            </div>
                            <div className="field col-12 md:col-6">
                                <h5 id="uom_mantis">Uom Mantis</h5>
                                <p htmlFor="uom_mantis">{itemDetail?.uom_mantis || '-'}</p>

                            </div>
                            <div className="field col-12 md:col-6">
                                <h5 id="receiving">Receiving</h5>
                                <p htmlFor="receiving">{(itemDetail.receiving == 1 || itemDetail.receiving == 'TRUE') ? 'true' : 'false'  || '-'}</p>

                            </div>
                            <div className="field col-12 md:col-6">
                                <h5 id="shipping">Shipping</h5>
                                <p htmlFor="shipping">{(itemDetail.shipping == 1 || itemDetail.shipping == 'TRUE') ? 'true' : 'false'  || '-'}</p>

                            </div>
                            <div className="field col-12 md:col-6">
                                <h5 id="is_kit_item">Is Kit</h5>
                                <p htmlFor="is_kit_item">{(itemDetail.is_kit_item == 1) ? 'true' : 'false' || '-'}</p>

                            </div>
                            <div className="field col-12 md:col-6">
                                <h5 id="is_ship_item">Is Ship</h5>
                                <p htmlFor="is_ship_item">{(itemDetail.is_ship_item == 1) ? 'true' : 'false' || '-'}</p>

                            </div>

                        </div>
                    </div>
              
                        
                </div>
                
            </div>
        </>

    );
}
