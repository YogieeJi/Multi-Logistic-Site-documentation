
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { ConveyorLanesService } from '../../../../service/operations/ConveyorLanesService';
import { PTLControllerService } from '../../../../service/operations/PTLControllerService';

export default function PTLControllerDetails() {
    const [ipDetail, setipDetail] = useState({
        'ip': '-',
        'description': '-'
    });

    const navigate = useNavigate();
    const params = useParams();

    useEffect(() => {
        getDetails();
    }, []);

    const getDetails = () => {
        PTLControllerService.getDetail(params.id).then((data) => {
            setipDetail(data.data);
        });
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3></h3>
                <div className='page-headerActions' style={{ display: "flex", gap: 30, alignItems: 'center' }}>
                    <Button label="Edit" icon="fa fa-solid fa-pen-to-square" severity="sucess" onClick={() => navigate("/operations/ptl-controller/edit/"+ipDetail.PK)} />                
                </div>
            </div>
            <h1></h1>

            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <br/>
                        <div className="p-fluid formgrid grid">
                            <div className="field col-12 md:col-6">
                                <h5 id="ip">IP</h5>
                                <p htmlFor="ip">{ipDetail.ip || '-'}</p>
                            </div>
                            <div className="field col-12 md:col-6">
                                <h5 id="description">Description</h5>
                                <p htmlFor="description">{ipDetail.description || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
