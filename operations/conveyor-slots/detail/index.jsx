
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { ConveyorSlotsService } from '../../../../service/operations/ConveyorSlotsService';
import { useAuth } from '../../../../store/useAuth';


export default function ConveyorSlotDetails() {
    const [slotDetail, setSlotDetail] = useState({
        'title': '-',
        'lane_id': '-',
        'mantis_location_id': '-'
    });

    const navigate = useNavigate();
    const params = useParams();

    useEffect(() => {
        getDetails();
    }, []);

    const getDetails = () => {
        ConveyorSlotsService.getSlotDetail(params.id).then((data) => {
            setSlotDetail(data.data);
        });
    };
   const {hasActionAccess} = useAuth();
       const PAGE_KEY = "Conveyor_Slots_details";
    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3></h3>
                <div className='page-headerActions' style={{ display: "flex", gap: 30, alignItems: 'center' }}>
                    {hasActionAccess(PAGE_KEY, "edit_lane") &&(<Button label="Edit" icon="fa fa-solid fa-pen-to-square" severity="sucess" onClick={() => navigate("/operations/conveyor-slots/edit/"+slotDetail.id)} />  )}              
                </div>
            </div>
            <h1></h1>

            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <br/>
                        <div className="p-fluid formgrid grid">
                            <div className="field col-12 md:col-6">
                                <h5 id="title">Title</h5>
                                <p htmlFor="title">{slotDetail.title || '-'}</p>
                            </div>
                            <div className="field col-12 md:col-6">
                                <h5 id="lane_id">Lane ID</h5>
                                <p htmlFor="lane_id">{slotDetail.lane_id || '-'}</p>
                            </div>
                            <div className="field col-12 md:col-6">
                                <h5 id="mantis_location_id">Mantis Location ID</h5>
                                <p htmlFor="mantis_location_id">{slotDetail.mantis_location_id || '-'}</p>
                            </div>
                            <div className="field col-12 md:col-6">
                                <h5 id="mantis_location_id">PTL IP</h5>
                                <p htmlFor="ip">{slotDetail.ip || '-'}</p>
                            </div>
                            <div className="field col-12 md:col-6">
                                <h5 id="mantis_location_id">PTL Address</h5>
                                <p htmlFor="ptl_address">{slotDetail.ptl_address || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
