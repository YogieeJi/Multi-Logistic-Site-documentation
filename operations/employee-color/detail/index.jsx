
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { EmployeeColorService } from '../../../../service/operations/EmployeeColorService';
import { useAuth } from '../../../../store/useAuth';

export default function EmployeeColorDetails() {
    const [colorDetail, setColorDetail] = useState({
        'color': '-',
        'mantis_user': '-'
    });
 const {hasActionAccess} = useAuth();
     const PAGE_KEY = "Employee_Color_details";
    const navigate = useNavigate();

    const [userId, setUserId] = useState(0);
    const params = useParams();

 

    useEffect(() => {
        getDetails();
    }, []);



    const getDetails = () => {
        EmployeeColorService.getDetail(params.id).then((data) => {
            setColorDetail(data.data);
        });
    };


    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Color: {colorDetail.color}</h3>
                <div className='page-headerActions' style={{ display: "flex", gap: 30, alignItems: 'center' }}>
                    {hasActionAccess(PAGE_KEY, "edit_user_color") &&(<Button label="Edit" icon="fa fa-solid fa-pen-to-square" severity="sucess" onClick={() => navigate("/operations/employee-color/edit/"+colorDetail.id)} /> )}               
                </div>
            </div>
            <h1></h1>

            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <br/>
                        <div className="p-fluid formgrid grid">
                            <div className="field col-12 md:col-4">
                                <h5 id="color">Color</h5>
                                <p htmlFor="color">{colorDetail.color || '-'}</p>

                            </div>
                            <div className="field col-12 md:col-4">
                                <h5 id="mantis_id">Mantis User</h5>
                                <p htmlFor="mantis_id">{colorDetail.usr_Login || '-'}</p>

                            </div>
                            
                        </div>
                    </div>
                </div>
                
            </div>
        </>

    );
}
