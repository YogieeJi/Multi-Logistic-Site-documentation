
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { removeData } from "../../../store/formMessage.slice"
import { DashboardService } from '../../../service/DashboardService';
import DashboardMenu from '../DashboardMenu';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { useAuth } from '../../../store/useAuth';


export default function Users() {
    const {hasActionAccess} = useAuth();
    const PAGE_KEY = "task_dashboard";
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [users, setUsers] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [UserDetailModel, setUserDetailModel] = useState(false);
    const [modelMsg, setModelMsg] = useState(null);
    const [UserDetail, setUserDetail] = useState([]);  
    const [UserName, setUserName] = useState([]); 
    const toast = useRef();
    const navigate = useNavigate();
    const [date, setDate] = useState(new Date());
    const dateRef = useRef(null); 
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 0,
        sortField: "",
        sortOrder: "",
        filters: {
            userName: { value: null, matchMode: 'contains' },
            TaskCount: { value: null, matchMode: 'contains' },
            AverageTimeInSeconds: { value: null, matchMode: 'contains' },
            QTY: { value: null, matchMode: 'contains' },
        }
    });

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
        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
         const data = {
                lazyState,
                ...lazyState,
                sortOrder: lazyState?.sortOrder?.toString() ?? null,
                date: date ? new Date(date).toLocaleDateString('en-CA') : null
            }
            DashboardService.getUserTaskData( (data) ).then((data) => {
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
            DashboardService.getUserTaskData().then((data) => {
                setSelectAll(true);
                setSelectedUsers(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedUsers([]);
        }
    };

    const getUserTaskDetail = (UserName) => {
        setUserDetail(null)
        setUserDetailModel(true)
        setUserName(UserName)
        setLoadingDetail(true);
        const data={
             date: date ? new Date(date).toLocaleDateString('en-CA') : null,
            user_name:UserName
        }
        DashboardService.getUserOrderDetail( (data) ).then((data) => {
            setUserDetail(data.data);
            
        }).finally(setLoadingDetail(false));
    }
    const cancleModel = (reload = false) => {
        setUserDetail(null)
        setUserName('')
        setUserDetailModel(false);
        
    }
    const emailBodyTemplate = (rowData) => {
        return (
            <>
                <span className="p-column-title">Email</span>
                <Link to={`${rowData.usr_ID}/${rowData.userName}/${date}`}>{rowData.userName}</Link>
            </>
        );
    };

    const nameBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.taskCount}
            </>
        );
    };

    useEffect(() => {
        if (date) {
          loadLazyData();
        }
      }, [date]);
   
    
      const goToReport = () => {
        navigate(`/user-task-report/${date}`);
      };
      const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <Calendar
                    ref={dateRef} 
                    value={date} 
                    onChange={(e) => setDate(e.value)} 
                    showIcon  
                    placeholder="Select a date" 
                    showOnFocus={false} 
                    inputRef={(el) => {
                        if (el) {
                            el.onmousedown = (e) => {
                                e.preventDefault();           
                                dateRef.current.show(); 
                            };
                        }
                    }} 
                />
            </span>
        </div>
    );

    const Refresh=()=>{
        loadLazyData();
    }
    return (
        <>
         <Dialog header={`Order Detail: ${UserName}`} receivingModel  visible={UserDetailModel} style={{ width: '50vw' }}
         position='top' onHide={() => {if (!UserDetailModel) return; cancleModel(); }}
         >
            
                    <p className="m-0">
                    <div className="flex flex-column px-8 py-5 gap-4" style={{ borderRadius: '12px', backgroundColor: '#f9f9f9'}}>
                        { (modelMsg != '') ?  (<p className="p-error font-semibold">{modelMsg}</p>) : ''}
                    </div>
                    </p>
                    {(!UserDetail) ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <ProgressSpinner />
                        </div>
                    ) : (
                        <div className="card p-0 " >
                            <DataTable removableSort 
                            value={UserDetail} 
                            className="datatable-responsive" 
                            emptyMessage="No records found." 
                            showGridlines 
                            sort 
                            tableStyle={{ minWidth: '40rem' }} 
                            size="small" 
                            stripedRows 
                            loading={loadingDetail} scrollable scrollHeight="350px" 
                            >
                                <Column/>
                                <Column header="Order Code" field="ord_code"    body={(data) => data.OrderCode}   />
                                <Column header="Order Status" field="ord_status"   body={(data) => data.OrderStatus}   />
                            </DataTable>
                        </div>
                    )}

        </Dialog>
        <DashboardMenu />
        <div className="flex flex-row-reverse flex-wrap">
                <div className="flex align-items-center justify-content-center">
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
        <Helmet>
            <title>User Task</title>
        </Helmet>
        <Toast ref={toast} />
        
        <h1></h1>
        <div className="card">
        <div className="flex justify-content-between align-items-center">
        <h3 className="m-0">User Task</h3>
        {hasActionAccess(PAGE_KEY, "download_pdf") &&(<Button 
            label="User Task Report" 
            icon="pi pi-file" 
            severity="p-button-primary" 
            onClick={goToReport}
        />)}
    </div>
            <DataTable 
                value={users} 
                lazy 
                filterDisplay="row" 
                dataKey="usr_ID" 
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
                header={header}
                scrollHeight="600px"
                removableSort
            >
              
                <Column field="userName" sortable header="User" headerStyle={{ width: '70rem' }} body={emailBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="taskCount" sortable  header="Total Task" body={nameBodyTemplate} />
                <Column field="averageTimeInSeconds" sortable header="Average Time (sec)" body={(rowData) => rowData.averageTimeInSeconds} />
                <Column field="qty" sortable header="Quantity" body={(rowData) => rowData.qty} />
                <Column field="activeTaskCount" sortable header="Active Task Count" body={(rowData) => rowData.activeTaskCount} />
                <Column field="activeOrderCount" sortable header="Active Order Count" body={(rowData) => rowData.activeOrderCount} />
                <Column
                header="View Detail"
                field="outer_QTY"
                headerStyle={{ width: '8%', minWidth: '6rem' }}
                body={(data) =>
                    data.activeTaskCount >= 1 ? (
                    <Button
                        label="View"
                        severity="info"
                        size="small"
                        outlined
                        onClick={() => getUserTaskDetail(data.userName)}
                    />
                    ) : null
                }
                />
            </DataTable>
        </div>
        </>
        
    );
}
        