
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { ItemConversionService } from '../../../../service/setups/ItemConversionService';
import { LanesSetupService } from '../../../../service/setups/LanesSetupService';

export default function LanesSetupDetails() {
    const [laneDetail, setLaneDetail] = useState({});
    const navigate = useNavigate();
    const params = useParams();

    useEffect(() => {
        getDetails();
    }, []);



    const getDetails = () => {
        LanesSetupService.getDetail(params.id).then((data) => {
            setLaneDetail(data.data);
        });
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Lanes Setup</h3>
                <div className='page-headerActions' style={{ display: "flex", gap: 30, alignItems: 'center' }}>
                    <Button label="Edit" icon="fa fa-solid fa-pen-to-square" severity="sucess" onClick={() => navigate("/setup/lanes/edit/"+laneDetail.id)} />                
                </div>
            </div>
            <h1></h1>

            
          


            <div className="grid">
                <div className="col-12">
                   
                    <div className="card">
                        <div className="p-fluid formgrid grid">
                            <div className="field col-12 md:col-6">
                                <h5 id="lane">Lane</h5>
                                <p htmlFor="lane">{laneDetail.lane || '-'}</p>

                            </div>
                            <div className="field col-12 md:col-6">
                                <h5 id="slots_count">No of Slots</h5>
                                <p htmlFor="slots_count">{laneDetail.slots_count || '-'}</p>

                            </div>
                            <div className="field col-12 md:col-6">
                                <h5 id="is_active">Is Active</h5>
                                <p htmlFor="is_active">{(laneDetail.is_active == 1) ? 'Yes' : 'No'}</p>

                            </div>
                            

                        </div>
                    </div>
              
                        
                </div>
                
            </div>
        </>

    );
}
