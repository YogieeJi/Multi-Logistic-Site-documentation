
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { ConveyorLanesService } from '../../../../service/operations/ConveyorLanesService';
import { useAuth } from '../../../../store/useAuth';

export default function ConveyorLaneDetails() {
    const [laneDetail, setLaneDetail] = useState({
        'title': '-',
        'conveyor_name': '-'
    });
    const {hasActionAccess} = useAuth();
    const PAGE_KEY = "Conveyor_Lanes_details";

    const navigate = useNavigate();
    const params = useParams();

    useEffect(() => {
        getDetails();
    }, []);

    const getDetails = () => {
        ConveyorLanesService.getLaneDetail(params.id).then((data) => {
            setLaneDetail(data.data);
        });
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3></h3>
                <div className='page-headerActions' style={{ display: "flex", gap: 30, alignItems: 'center' }}>
                    {hasActionAccess(PAGE_KEY, "edit_lane") &&(<Button label="Edit" icon="fa fa-solid fa-pen-to-square" severity="sucess" onClick={() => navigate("/conveyor/conveyor-lanes/edit/"+laneDetail.id)} />)}               
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
                                <p htmlFor="title">{laneDetail.title || '-'}</p>
                            </div>
                            <div className="field col-12 md:col-6">
                                <h5 id="conveyor_name">Conveyor Name</h5>
                                <p htmlFor="conveyor_name">{laneDetail.conveyor_name || '-'}</p>
                            </div>
                            <div className="field col-12 md:col-6">
                                <h5 id="conveyor_name">Conveyor ID</h5>
                                <p htmlFor="conveyor_name">{laneDetail.conveyor_id || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
