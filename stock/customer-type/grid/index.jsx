
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import { useDispatch, useSelector } from 'react-redux';
import { removeData } from "../../../../store/formMessage.slice"
import { ConveyorLanesService } from '../../../../service/operations/ConveyorLanesService';
import { OrdersImportService } from '../../../../service/outbound/OrdersImportService';
import { Customer } from '../../../../service/stock/customer';
import { Dropdown } from 'primereact/dropdown';
import { Badge } from 'primereact/badge';
import { Dialog } from 'primereact/dialog';
import { useLazySort } from "../../../../components/useLazySort";
import { useAuth } from '../../../../store/useAuth';


export default function ConveyorLanes() {
    const {hasActionAccess} = useAuth();
        const PAGE_KEY = "customer-ordertype";
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [lanes, setLanes] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedLanes, setSelectedLanes] = useState(null);
    const toast = useRef();
    const [order, setOrder] = useState([]);
    const [id, setId] = useState('');
    const [type, setType] = useState('');
    const navigate = useNavigate();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            ort_Description: { value: null, matchMode: 'contains' },
            CustomerFullName: { value: null, matchMode: 'contains' },
            cus_Code: { value: null, matchMode: 'contains' },
            order_type: { value: null, matchMode: 'contains' },
        }
    });
        const { onSort } = useLazySort(setlazyState);
    
    const [displayConfirmation1, setDisplayConfirmation1] = useState(false);
    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)
    const [btnDisabled, setbtnDisabled] = useState(false);
    const dispatch = useDispatch()
    const [orderAssignTypeDropdownlist, setOrderAssignTypeDropdownlist] = useState(null);
    const [removeItemData, setRemoveItemData] = useState({
        id: '',
    });

    const items = [{ label: 'Orders' }, { label: 'Customer'}];
    const home = { icon: 'pi pi-home', url: '/order-dashboard' }

    let networkTimeout = null;
    useEffect(() => {
        orderDropDown()
        ordertype()
    }, []);
    
    const orderDropDown = () => {  
        Customer.getOrderTypes().then((data) => {
            setOrder(data.data);
        });
    }

    const ordertype =()=>{ 
        OrdersImportService.getOrderTypes().then((data) => {         
         setOrderAssignTypeDropdownlist(data.data);       
        });
    }

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
            Customer.getCustomerAttributes( (lazyState) ).then((data) => {
                
                setTotalRecords(data.totalRecords);
                setLanes(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
    };

    const onPage = (event) => {
        setlazyState(event);
    };

    // const onSort = (event) => {
    //     setlazyState(event);
    // };

    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };

    const onSelectionChange = (event) => {
        const value = event.value;

        setSelectedLanes(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            ConveyorLanesService.getOrderSLot().then((data) => {
                setSelectAll(true);
                setSelectedLanes(data.totalRecords);
            });
        } else {
            setSelectAll(false);
            setSelectedLanes([]);
        }
    };

    const titleBodyTemplate = (rowData) => {
        return (
            <>
               {rowData.cus_Code}
            </>
        );
    };

    const nameBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.CustomerFullName}
            </>
        );
    };
    const isErrorLane_BodyTemplate = (rowData) => {
        return (
            <>
                { (rowData.Is_ErrorLane == 1)?<Badge value="Yes" severity="danger"></Badge> : <Badge value="No" severity="success"></Badge> }
            </>
        );
    };
    const lane_type_BodyTemplate = (rowData) => {
        return (
            <>
                { (rowData.lane_type == 2)?<Badge value="Shipping" severity="primary"></Badge> : <Badge value="Conveyor" severity="success"></Badge> }
            </>
        );
    };
    
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-end md:align-items-center">         

            <span className="block mt-2 md:mt-0 p-input-icon-left">
                
                <Button label="Dashboard" size="small" icon="fa fa-home" severity="sucess"  onClick={() => navigate('/shipping-dashboard')}/>
            </span>
        </div>
    );
    const dltBodyTemplate = (rowData) => {
        return (<Button type="button" severity='danger' onClick={()=>removeItemsPopup(rowData.id)} icon="pi pi-trash" rounded></Button>);
    
    };
    const removeItemsPopup = (id) => {
        console.log(id);
        setRemoveItemData({
            id
        })
        setDisplayConfirmation1(true)
    }
    const confirmationDialogFooter1 = (
        <>
            <Button type="button" disabled={btnDisabled} label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation1(false)} className="p-button-text" />
            <Button type="button" disabled={btnDisabled} label="Yes" icon="pi pi-check" onClick={() => removeItem()} className="p-button-text" autoFocus />
        </>
    );
    const removeItem = () => {
        setbtnDisabled(true);
        setLoading(true);
        ConveyorLanesService.deleteOrderSlot(removeItemData).then((data) => {
            setLoading(false);
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else{
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
            // loadGrid({});
            setDisplayConfirmation1(false)
            setbtnDisabled(false);
            loadLazyData();
        });}
        const statusBodyTemplate = (rowData) => {
            return (
                
                
                <>    {rowData.pst_MessageCode === 'Status_Pending' && (
                    <Badge value="Status_Pending" severity="warning" />
                  )}
                  {rowData.pst_MessageCode === 'Status_Executing' && (
                    <Badge value="Status_Executing" severity="info" />
                  )}
                  {rowData.pst_MessageCode === 'Status_Done' && (
                    <Badge value="Status_Done" severity="success" />
                  )}
                  {rowData.pst_MessageCode === 'Status_Cancelled' && (
                    <Badge value="Status_Cancelled" severity="danger" />
                  )}
                  {rowData.pst_MessageCode === 'Status_Suspended' && (
                    <Badge value="Status_Suspended" severity="secondary" />
                  )}
                  {rowData.pst_MessageCode === 'Status_Incomplete' && (
                    <Badge value="Status_Incomplete" severity="error" />
                  )} </>
            );
            
            
        };
        const noprinttemplate = (rowData) => {
            return (
                
                
                <>     { (rowData.is_noprint == 1)?<Badge value="Yes" severity="success"></Badge> : <Badge value="No" severity="danger"></Badge> } </>
            );
            
            
        };
        const slotsDropDownEditor = (options) => {
            return (
                <Dropdown 
                    className="select-box"
                    value={options.value || options.rowData.ctv_value || null}  // Set default value
                    options={Array.isArray(order) ? order : []} 
                    onChange={(event) => {
                        options.editorCallback(event.value);  // Updates the table cell
                        setId(event.value);                   // Updates the state
                    }}
                    optionLabel="ort_Description" 
                    optionValue="ort_Code"
                    placeholder="Select Order Type"
                    
                    editable
                />
            );
        };
        const orderTypeDropDownEditor = (options) => {
            return (
                <Dropdown 
                    className="select-box"
                    value={options.value || options.rowData.order_type || null}  // Set default value
                    options={Array.isArray(orderAssignTypeDropdownlist) ? orderAssignTypeDropdownlist : []} 
                    onChange={(event) => {
                        options.editorCallback(event.value);  // Updates the table cell
                        setType(event.value);                   // Updates the state
                    }}
                    optionLabel="order_type" 
                    optionValue="id"
                    placeholder="Select Order Type"
                    
                    editable
                />
            );
        };
       

        const onReceivingRowEditComplete = (e) => {
       
            setLoading(true);
            let { newData, index } = e;

            const data = {
                order_id :id ? id : newData.order_id,
                cus_id: newData.cus_ID,
                order_type: type ? type : newData.type,
                cus_Code:newData.cus_Code,
               
            };
            // console.log(data);
           
            Customer.insertCustomerAttribute(data).then((data) => {
            setId('');
            setType('');
                if(data.error == 0){
                    toast.current.show({ severity: 'success', summary: 'Data Updated.', detail: data.message});
                    
                    setLoading(false);
                    loadLazyData();
    
                } else{
                    setLoading(false);
                    toast.current.show({ severity: 'error', summary: 'Error while update.', detail: data.message});
                }
            });
        };
        const textEditor = (options) => {
            return <InputText type="text" style={{ width: '90%' }} value={options.value || ''} onChange={(e) => options.editorCallback(e.target.value)} />;
        };
    return (
        <>
        <Helmet>
            <title>Customer</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
        <Dialog closable={false} header="Confirmation" visible={displayConfirmation1} onHide={() => setDisplayConfirmation1(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter1}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to remove this order slot?</span>
                </div>
            </Dialog>
        <h1></h1>
        <div className="card">
            <h3>Customer</h3>
            <DataTable 
                value={lanes} 
                lazy 
                filterDisplay="row" 
                dataKey="cus_ID" 
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
                selection={selectedLanes} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                scrollable 
                scrollHeight="600px"
                editMode="row"
                onRowEditComplete={onReceivingRowEditComplete}
            >
                {/* <Column selectionMode="single" headerStyle={{ width: '3rem' }} /> */}
           
                <Column field="cus_Code" header="Code" body={titleBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                <Column field="CustomerFullName" header="Customer Name" body={(rowData) => rowData.customerFullName}  filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                <Column field="ort_Description" editor={(options) => slotsDropDownEditor(options)} header="Order Type" body={(data) => data.ort_Description} showFilterMenu={false} sortable filter filterPlaceholder="Search" />    
                <Column field="order_type" editor={(options) => orderTypeDropDownEditor(options)} header="Shipment Type" body={(data) => data.order_type} showFilterMenu={false} sortable filter filterPlaceholder="Search" />    
                {hasActionAccess(PAGE_KEY,"edit")&&(<Column   rowEditor="true" header="Action"  headerStyle={{ width: '10%', minWidth: '8rem' }} bodyStyle={{ textAlign: 'left' }}></Column>)}
            </DataTable>
        </div>
        </>
        
    );
}
        