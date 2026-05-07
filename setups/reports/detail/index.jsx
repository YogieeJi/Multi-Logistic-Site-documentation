
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { SetupReportsService } from '../../../../service/setups/SetupReports';
import { useAuth } from '../../../../store/useAuth';


export default function SetupReportDetails() {
    const [reportDetail, setReportDetail] = useState({
        'created_at': '-',
        'fcy': '-'
    });
    const navigate = useNavigate();
    const params = useParams();
    const {hasActionAccess} = useAuth();
     const PAGE_KEY = "Reports_Setup_Details";
    useEffect(() => {
        getDetails();
    }, []);



    const getDetails = () => {
        SetupReportsService.getReportDetail(params.id).then((data) => {
            setReportDetail(data.data);
        });
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Dynamic Report</h3>
                <div className='page-headerActions' style={{ display: "flex", gap: 30, alignItems: 'center' }}>
                    {hasActionAccess(PAGE_KEY,"edit_report") &&(<Button label="Edit" icon="fa fa-solid fa-pen-to-square" severity="sucess" onClick={() => navigate("/setup/reports/edit/"+reportDetail.id)} />  )}              
                </div>
            </div>
            <h1></h1>

            
          


            <div className="grid">
                <div className="col-12">
                   
                    <div className="card">
                        <h4>Report Info</h4>
                        <br/>
                        <div className="p-fluid formgrid grid">
                            <div className="field col-12 md:col-4">
                                <h5 id="report_name">Report Name</h5>
                                <p htmlFor="report_name">{reportDetail.report_name || '-'}</p>

                            </div>
                            <div className="field col-12 md:col-4">
                                <h5 id="module">Module</h5>
                                <p htmlFor="module">{reportDetail.module || '-'}</p>

                            </div>
                            <div className="field col-12 md:col-4">
                                <h5 id="module">Enabled/Disabled</h5>
                                <p htmlFor="module">{(reportDetail.is_active == false) ? 'Disabled':'Enabled' || '-'}</p>

                            </div>
                            <div className="field col-12 md:col-12">
                                <h5 id="query">Query</h5>
                                <p htmlFor="query">{reportDetail.query || '-'}</p>

                            </div>

                          
                          
                           
                            
                        </div>
                    </div>
              
                        
                </div>
                
            </div>
        </>

    );
}
