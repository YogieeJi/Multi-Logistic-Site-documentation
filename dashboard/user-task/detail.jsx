
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useNavigate,useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { useDispatch, useSelector } from 'react-redux';
import { removeData } from "../../../store/formMessage.slice"
import { UserSettingService } from '../../../service/settings/UserSettingService';
import UserDashboardMenu from './userDashboardMenu';
import { DashboardService } from '../../../service/DashboardService';
export default function Users() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [users, setUsers] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState(null);
    const toast = useRef();
    const navigate = useNavigate();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 0,
        sortField: "",
        sortOrder: "",
        filters: {
            trt_MessageCode: { value: null, matchMode: 'contains' },
            QTY: { value: null, matchMode: 'contains' },
            TaskCount: { value: null, matchMode: 'contains' },
            tsk_SSCC: { value: null, matchMode: 'contains' },
            AverageTimeInSeconds: { value: null, matchMode: 'contains' },
            TaskType: { value: null, matchMode: 'contains' },
        }
    });
    const params = useParams();
    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)
    const dispatch = useDispatch()
   
   

    let networkTimeout = null;


    useEffect(() => {
        if(formMessageDetail != ''){
            toast.current.show({ severity: formMessageSeverity, summary: formMessageSummary, detail: formMessageDetail});
            dispatch(removeData());
        }
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        const data = {
            lazyState,
            id:params.id,
            date: params.date,
            name: params.name
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            DashboardService.getUserTaskDetail( (data) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setUsers(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
    };

    const onPage = (event) => {
        setlazyState(event);
    };

    const onSort = (event) => {
        setlazyState(event);
    };

    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };

    const onSelectionChange = (event) => {
        const value = event.value;

        setSelectedUsers(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            DashboardService.getUserTaskDetail().then((data) => {
                setSelectAll(true);
                setSelectedUsers(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedUsers([]);
        }
    };

    return (
        <>
        <UserDashboardMenu />
         <Button
            label="Back"
            icon="pi pi-arrow-left"
            className="p-button-primary"
            onClick={() => navigate('/user-task-dashboard')} 
            style={{ margin: '10px 0' }}
        />
        <Helmet>
            <title>User Task Detail</title>
        </Helmet>
        <Toast ref={toast} />
        <div className="card">
                {/* <h3>Shipment</h3> */}
                <h1></h1>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-4">
                        <h4 id="created_at">User Name:</h4>
                        <p htmlFor="created_at">{params.name}</p>
                        </div>
                        <div className="field col-12 md:col-4">
                        <h4 id="created_at">Date:</h4>
                        <p htmlFor="created_at">{new Date(params.date).toLocaleDateString('en-CA')}</p>

                    </div>
                       

                   
                
                </div>
            </div>
        
        <h1></h1>
        <div className="card">
            <h3>User Task Detail</h3>
            <DataTable 
                value={users} 
                lazy 
                filterDisplay="row" 
                dataKey="id" 
                paginator
                showGridlines
                first={lazyState.first} 
                rows={lazyState.rows} 
                totalRecords={totalRecords} 
                onPage={onPage}
                onSort={onSort} 
                size={'small'}
                sortField={lazyState.sortField}    
                className="datatable-responsive"
                sortOrder={lazyState.sortOrder}
                onFilter={onFilter} 
                filters={lazyState.filters} 
                rowsPerPageOptions={[25, 50, 100, 500, 1000]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                loading={loading} 
                tableStyle={{ minWidth: '75rem' }}
                emptyMessage="No records found."
                selection={selectedUsers} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                scrollable 
                scrollHeight="600px"
                removableSort
            >
              
           
                <Column field="trt_MessageCode " header="Task Type " body={(rowData) => rowData.trt_MessageCode} filterMenuStyle={{ width: '14rem' }} sortable />
                <Column field="QTY" sortable header="Quantity" body={(rowData) => rowData.qty} />
                <Column field="TaskCount" sortable header="Task Count" body={(rowData) => rowData.taskCount} />
                <Column field="AverageTimeInSeconds" sortable header="Time completion (sec) " body={(rowData) => rowData.averageTimeInSeconds} />
                <Column field="TaskType " header="Task Type " body={(rowData) => rowData.taskType} filterMenuStyle={{ width: '14rem' }} sortable />

            </DataTable>
        </div>
        </>
        
    );
}
        