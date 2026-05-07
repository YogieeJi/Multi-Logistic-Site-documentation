
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { useDispatch, useSelector } from 'react-redux';
import { removeData } from "../../../store/formMessage.slice"
import { ManageOrdersTaskService } from '../../../service/operations/ManageOrdersTaskService';
import { Dialog } from 'primereact/dialog';


export default function ManageOrderTask() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [ordersTask, setOrdersTask] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const [btnDisabled, setbtnDisabled] = useState(false);
    const toast = useRef();
   
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: "ord_id",
        sortOrder: "",
        filters: {
            ord_code: { value: null, matchMode: 'contains' },
            ord_id: { value: null, matchMode: 'contains' },
        }
    });

    const [removeOrdersTask, setRemoveOrdersTask] = useState({
        order_id: '',
    })

    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)

    const dispatch = useDispatch()


    const items = [{ label: 'Other' }, { label: 'Manage Orders Task'}];
    const home = { icon: 'pi pi-home', url: '/' }

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

        networkTimeout = setTimeout(() => {
            ManageOrdersTaskService.getGrid( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setOrdersTask(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
    };

    const deleteTask = () => {
        setbtnDisabled(true);
        ManageOrdersTaskService.deleteTask( (removeOrdersTask) ).then((data) => {
            if(data.data.result.IsSuccess){
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            }else{
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
            setDisplayConfirmation(false)
            setbtnDisabled(false);
            loadLazyData();
        });
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

    const orderIDBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ord_id}
            </>
        );
    };

    const OrderCodeBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ord_code}
            </>
        );
    };

    const TaskCountBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.task_count}
            </>
        );
    };
    const ActionBodyTemplate = (rowData) => {
        return (
             <Button type="button" onClick={()=>deleteTaskPopup(rowData.ord_id)} icon="pi pi-trash" rounded></Button>
        );
    };

    const confirmationDialogFooter = (
        <>
            <Button type="button" disabled={btnDisabled} label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" disabled={btnDisabled} label="Yes" icon="pi pi-check" onClick={() => deleteTask()} className="p-button-text" autoFocus />
        </>
    );

    const deleteTaskPopup = (id) => {
        setRemoveOrdersTask({
            order_id: id
        })
        setDisplayConfirmation(true)
    }

    
    return (
        <>
        <Helmet>
            <title>Manage Orders Task</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
        <Dialog closable={false} header="Confirmation" visible={displayConfirmation} onHide={() => setDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to remove this item?</span>
            </div>
        </Dialog>
        <h1></h1>
        <div className="card">
            <h3>Manage Orders Task</h3>
            <DataTable 
                value={ordersTask} 
                lazy 
                filterDisplay="row" 
                dataKey="ord_id" 
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
                rowsPerPageOptions={[10, 25, 50, 100]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                loading={loading} 
                tableStyle={{ minWidth: '70rem' }}
                emptyMessage="No records found."
                scrollable 
                stripedRows 
                scrollHeight="600px"
                removableSort
            >
                <Column field="ord_id" sortable header="Order ID" body={orderIDBodyTemplate} showFilterMenu={false}  filter filterPlaceholder="Search" headerStyle={{ width: '10rem' }}/>
                <Column field="ord_code" sortable header="Order Code" body={OrderCodeBodyTemplate}  showFilterMenu={false}  filter filterPlaceholder="Search By Order Code"/>
                <Column field="task_count"  header="Task Count" body={TaskCountBodyTemplate} headerStyle={{ width: '7rem' }} />
                <Column field="action"  header="Action" body={ActionBodyTemplate} headerStyle={{ width: '5rem' }} />

            </DataTable>
        </div>
        </>
        
    );
}
        