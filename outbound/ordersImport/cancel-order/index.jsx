import { Badge } from 'primereact/badge';
import { Dropdown } from 'primereact/dropdown';
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useNavigate,useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Dialog } from 'primereact/dialog';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { useDispatch, useSelector } from 'react-redux';
import { removeData } from "../../../../store/formMessage.slice"
import { UserSettingService } from '../../../../service/settings/UserSettingService';
import { Menubar } from 'primereact/menubar';
import OrderMenu from '../OrderMenu';
import { Menu } from 'primereact/menu';
import { MultiSelect } from 'primereact/multiselect';
import { OrdersImportService } from '../../../../service/outbound/OrdersImportService';
import { LocationsService } from '../../../../service/misc/LocationsService';
export default function Users() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [users, setUsers] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState(null);
    const [userTask, setUsersTask] = useState(null);
    const [displayConfirmation9, setDisplayConfirmation9] = useState(false);
    const [usersDropdownlist, setUsersDropdownlist] = useState(null);
    const [btnDisabled, setbtnDisabled] = useState(true);
   

    const toast = useRef();
    const navigate = useNavigate();
    const [selectedAisle, setSelectedAisle] = useState(null);
    const [Aisle, setAisle] = useState(null);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
         
            osi_QuantitySU: { value: null, matchMode: 'contains' },
            ori_ItemUnit: { value: null, matchMode: 'contains' },
            osi_Quantity: { value: null, matchMode: 'contains' },      
            product: { value: null, matchMode: 'contains' },
        }
    });

   

    const dispatch = useDispatch()
    const params = useParams();


    let networkTimeout = null;


    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            const data =  lazyState;
            data.code = params.pick_list_id;
            OrdersImportService.getOrderItem((data)).then((data) => {
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
        if (!event.sortField) {
            return; // Prevent crashing when event is empty
        }
        setlazyState((prevState) => {
            let newSortOrder;
            const currentSortOrder = prevState.sortOrder?.toString() || "0"; 

           if (prevState.sortField === event.sortField) {
                if (currentSortOrder === "1") {
                    newSortOrder = "-1";  // Descending
                } else if (currentSortOrder === "-1") {
                    newSortOrder = "0";  // No Sort
                } else {
                    newSortOrder = "1";  // Ascending
                }
            } else {
                newSortOrder = "1";
            }

            // If sorting is reset (0), clear the sort field
            const newSortField = newSortOrder === "0" ? "" : event.sortField;
            return {
                ...prevState,
                sortField: newSortField,  // Clear the field when sorting is reset
                sortOrder: newSortOrder,
            };
        });
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
            // OrdersImportService.getOrdersTask().then((data) => {
                setSelectAll(true);
                setSelectedUsers(users);
            // });
        } else {
            setSelectAll(false);
            setSelectedUsers([]);
        }
    };

    const nameBodyTemplate = (rowData) => {
        let badgeProps = { value: rowData.shipItemStatus, severity: "secondary" }; 
    
        if (rowData.shipItemStatus === '0 - Pending') {
            badgeProps = { value: "0 - Pending", severity: "warning" };
        } else if (rowData.shipItemStatus === '40 - Picked') {
            badgeProps = { value: "40 - Picked", severity: "info" };
        } else if (rowData.shipItemStatus === '90 - Completed') {
            badgeProps = { value: "90 - Completed", severity: "success" };
        } else if (rowData.shipItemStatus === '99 - Cancelled') {
            badgeProps = { value: "99 - Cancelled", severity: "danger" };
        }else if (rowData.shipItemStatus === '30 - For picking') {
            badgeProps = { value: "30 - For picking", severity: "primary" };
        }
    
        return <Badge {...badgeProps} />;
    };

    const actionItems = [
        {
            label: 'Cancel Item',
            icon: 'fa fa-times',
            command: () => {
                if(selectedUsers != null && selectedUsers.length >= 1){   
                    setbtnDisabled(false) 
                    setDisplayConfirmation9(true)
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Please select 1 order item' });
                }
            }
        },]

       
    const menuLeft = useRef(null);
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">

            <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
            <Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />
            </span>
      
            
        </div>
    );
    // const statusDropdownList = [
    //     { id: 'Status_Pending', order_type: 'Status Pending', severity: 'warning' },
    //     { id: 'Status_Executing', order_type: 'Status Executing', severity: 'info' },
    //     { id: 'Status_Done', order_type: 'Status Done', severity: 'success' },
    //     { id: 'Status_Cancelled', order_type: 'Status Cancelled', severity: 'danger' },
    //     { id: 'Status_Suspended', order_type: 'Status Suspended', severity: 'secondary' },
    //     { id: 'Status_Incomplete', order_type: 'Status Incomplete', severity: 'error' }
    // ];
    // const OrderTypeRowFilterTemplate = (options) => {
    //     return (
    //         <Dropdown
    //             style={{ minWidth: '3em', width: '3em'  }}
    //             value={options.id}
    //             optionValue="id"
    //             optionLabel="order_type"
    //             options={statusDropdownList}
    //             onChange={(e) => options.filterApplyCallback(e.value)}
    //             placeholder="Select Status"
    //             className="p-column-filter"
    //             showClear
    //             itemTemplate={(option) => (
    //                 <div className="p-d-flex p-ai-center">
    //                     <Badge value={option.order_type} severity={option.severity} />
    //                 </div>
    //             )}
    //         />
    //     );
    // };
    
    const onSubmitUser = () => {
        setbtnDisabled(true);
        const data = {
            ids: [selectedUsers.map(user => user.osi_OrderItemID).toString()]
        };
        // console.log(data)
        OrdersImportService.cancelItem( (data) ).then((data) => {
            setLoading(false);
            
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setSelectAll(false);
                setSelectedUsers([]);
                loadLazyData();
                
            } 
            else{
                setSelectAll(false);
                setSelectedUsers([]);
                setbtnDisabled(false);
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setbtnDisabled(false);
            setDisplayConfirmation9(false)
        });
        
    };

   
    const confirmationDialogFooter9 = (
        <div>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation9(false)} className="p-button-text" />
            <Button type="button" disabled={btnDisabled} label="Yes" icon="pi pi-check" onClick={() => onSubmitUser()} className="p-button-text" autoFocus  />
        </div>
    );
    return (
        <>
        <OrderMenu/>
        <Button
            label="Back"
            icon="pi pi-arrow-left"
            className="p-button-primary"
            onClick={() => navigate("/outbound/orders-import")} 
            style={{ margin: '10px 0' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>PickList # {params.pick_list_id}</h3>
        </div>
        <Helmet>
            <title>Order Task</title>
        </Helmet>
        <Toast ref={toast} />

         <Dialog header="Confirmation" visible={displayConfirmation9} style={{ width: '350px' }} onHide={() => setDisplayConfirmation9(false)} footer={confirmationDialogFooter9}>
         <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
                    </Dialog>
        
        <h1></h1>
        <div className="card">
            <h3>Order Item</h3>
            <DataTable 
                value={users} 
                lazy 
                filterDisplay="row" 
                dataKey="osi_ID" 
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
                tableStyle={{ minWidth: '75rem' }}
                emptyMessage="No records found."
                selection={selectedUsers} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                header={header}
                scrollable 
                scrollHeight="600px"
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                <Column field="product" header="Item" body={(rowData) => rowData.product} sortable filter showFilterMenu={false} filterPlaceholder="Search" />           
                <Column field="osi_Quantity" header="Quantity" body={(rowData) => rowData.osi_Quantity} sortable filter showFilterMenu={false} filterPlaceholder="Search" />
                <Column field="ori_ItemUnit" header="Item Unit" body={(rowData) => rowData.ori_ItemUnit} sortable filter showFilterMenu={false} filterPlaceholder="Search" />               
                <Column field="osi_QuantitySU" header="Quantity Sale Unit" body={(rowData) => rowData.osi_QuantitySU} sortable/>             
                <Column field="shipItemStatus"   header="Item Status" body={nameBodyTemplate} sortable  /> 
            </DataTable>
        </div>
        </>
        
    );
}
        