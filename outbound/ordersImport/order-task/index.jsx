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
import { useAuth } from '../../../../store/useAuth';


export default function Users() {
    const {hasActionAccess} = useAuth();
         const PAGE_KEY = "order_task";
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
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            tsk_Code: { value: null, matchMode: 'contains' },
            tsk_CreateTime: { value: null, matchMode: 'contains' },
            tsk_TaskListID: { value: null, matchMode: 'contains' },
            tsk_FromLocationCode: { value: null, matchMode: 'contains' },
            tsk_ToLocationCode: { value: null, matchMode: 'contains' },
            tsk_SSCC: { value: null, matchMode: 'contains' },
            tsk_Quantity: { value: null, matchMode: 'contains' },
            tsk_Timestamp: { value: null, matchMode: 'contains' },
            tsk_FinalLocationCode: { value: null, matchMode: 'contains' },
            task_status: { value: null, matchMode: 'contains' },
            ComboDescription: { value: null, matchMode: 'contains' },
            ProductShortDescription: { value: null, matchMode: 'contains' },
            tsk_ItemUnitID: { value: null, matchMode: 'contains' },
            tsk_PriorityID: { value: null, matchMode: 'contains' },
            tsk_ExecutionOrder: { value: null, matchMode: 'contains' },
            tsk_LogisticSiteID: { value: null, matchMode: 'contains' },
            CreateUser: { value: null, matchMode: 'contains' },
            assigned_user: { value: null, matchMode: 'contains' },
            executed_user: { value: null, matchMode: 'contains' },
            loc_SectorCode: { value: null, matchMode: 'in' }
           
        }
    });

    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)

    const dispatch = useDispatch()
    const params = useParams();


    let networkTimeout = null;


    useEffect(() => {
        loadLazyData();
    }, [lazyState]);
    useEffect(() => {
        
        UserSettingService.getMantisUsers().then((data) => {
            if (data.error === 0 && Array.isArray(data.data)) {
                const formattedUsers = data.data.map(user => ({
                    emp_ID: user.emp_ID || user.id, 
                    Name: user.name || user.username 
                }));
                setUsersDropdownlist(formattedUsers);
            } else {
                console.error("Invalid response:", data);
            }
        });
        OrdersImportService.getSectorCode(params.pick_list_id).then((data) => {
            if(data.error == 0){
                const formattedAisles = data.data.map(item => ({
                    name: `${item.loc_SectorCode}(T-${item.location_Count})(Q-${item.total_Quantity})` ,
                    code: item.loc_SectorCode,
                }));
                // Update the state only if there are formatted aisles
                if (formattedAisles.length > 0) {
                    setAisle(formattedAisles);
                } else {
                    // Optionally clear aisles if no data exists
                    setAisle([]);
                }
            }
        });
    }, []);

    const loadLazyData = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            const data =  lazyState;
            data.code = params.pick_list_id;
            OrdersImportService.getOrdersTask((data)).then((data) => {
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

    const emailBodyTemplate = (rowData) => {
        return (
            <>
                <span className="p-column-title">Email</span>
                <Link to={`${rowData.id}`}>{rowData.email}</Link>
            </>
        );
    };


    const nameBodyTemplate = (rowData) => {
        return (
            
            
            <>    {rowData.task_Status === 'Status_Pending' && (
                <Badge value="Status_Pending" severity="warning" />
              )}
              {rowData.task_Status === 'Status_Executing' && (
                <Badge value="Status_Executing" severity="info" />
              )}
              {rowData.task_Status === 'Status_Done' && (
                <Badge value="Status_Done" severity="success" />
              )}
              {rowData.task_Status === 'Status_Cancelled' && (
                <Badge value="Status_Cancelled" severity="danger" />
              )}
              {rowData.task_Status === 'Status_Suspended' && (
                <Badge value="Status_Suspended" severity="secondary" />
              )}
              {rowData.task_Status === 'Status_Incomplete' && (
                <Badge value="Status_Incomplete" severity="error" />
              )} </>
        );
        
        
    };
    const createdAtBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.created_at}
            </>
        );
    };
    const actionItems = [
         hasActionAccess(PAGE_KEY, "assign_user") &&{
            label: 'Assign User',
            icon: 'pi pi-user',
            command: () => {
                if(selectedUsers != null && selectedUsers.length >= 1){   
                    setbtnDisabled(true) 
                    setDisplayConfirmation9(true)
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Please select 1 order task' });
                }
            }
        },].filter(Boolean)

       
    const menuLeft = useRef(null);
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">

            <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
           {actionItems.length > 0 && (<Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />)}
            </span>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
            <MultiSelect
                    value={selectedAisle} 
                    onChange={(e) => {
                        const selectedValues = e.value ? e.value.map((item) => item.code) : null; // Extract only 'code' values
                        setSelectedAisle(e.value); // Update selectedAisle with the entire object
                        setlazyState((prevState) => ({
                            ...prevState,
                            filters: {
                                ...prevState.filters,
                                loc_SectorCode: {
                                    value: selectedValues.toString(), // Update lazyState with 'code' values
                                    matchMode: 'in', // Optional, based on filter logic
                                },
                            },
                        }));
                    }}
                    options={Aisle}
                    optionLabel="name"
                    filter
                    placeholder="Select Aisles"
                    maxSelectedLabels={3}
                    className="w-full md:w-20rem"
                />
        </span>
            
        </div>
    );
    const statusDropdownList = [
        { id: 'Status_Pending', order_type: 'Status Pending', severity: 'warning' },
        { id: 'Status_Executing', order_type: 'Status Executing', severity: 'info' },
        { id: 'Status_Done', order_type: 'Status Done', severity: 'success' },
        { id: 'Status_Cancelled', order_type: 'Status Cancelled', severity: 'danger' },
        { id: 'Status_Suspended', order_type: 'Status Suspended', severity: 'secondary' },
        { id: 'Status_Incomplete', order_type: 'Status Incomplete', severity: 'error' }
    ];
    const OrderTypeRowFilterTemplate = (options) => {
        return (
            <Dropdown
                style={{ minWidth: '3em', width: '3em'  }}
                value={options.id}
                optionValue="id"
                optionLabel="order_type"
                options={statusDropdownList}
                onChange={(e) => options.filterApplyCallback(e.value)}
                placeholder="Select Status"
                className="p-column-filter"
                showClear
                itemTemplate={(option) => (
                    <div className="p-d-flex p-ai-center">
                        <Badge value={option.order_type} severity={option.severity} />
                    </div>
                )}
            />
        );
    };

    const onSubmitUser = () => {
        setbtnDisabled(true);

        // Pre-validation: block completed tasks
        const hasCompleted = selectedUsers.some(x => x.executed_user);
        if (hasCompleted) {
            setbtnDisabled(false);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Task is already completed. User assignment not allowed.'
            });
            setDisplayConfirmation9(false)
            return;
        }

        const data = {
            orders : params.pick_list_id,
            user: userTask,
            task: selectedUsers,
        }
        // console.log(data)
        OrdersImportService.updateTask(data).then((data) => {
            setLoading(false);
            
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setSelectAll(false);
                setSelectedUsers([]);
                loadLazyData();
                setUsersTask(null);
            } 
            else{
                setSelectAll(false);
                setSelectedUsers([]);
                setbtnDisabled(false);
                setUsersTask(null);
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setbtnDisabled(false);
            setDisplayConfirmation9(false)
        });
        
    };

   
    const confirmationDialogFooter9 = (
        <div>
            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitUser()} />
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

         <Dialog header="Assign User" visible={displayConfirmation9} style={{ width: '50vw' }} onHide={() => setDisplayConfirmation9(false)} footer={confirmationDialogFooter9}>
                        <div className="p-fluid formgrid grid">
                            <div className="field col-12 md:col-9">
                                <label>Users*</label>
                                <Dropdown 
                                    style={{marginRight:5, marginLeft:10}} 
                                    value={userTask}
                                    optionValue="emp_ID" 
                                    optionLabel="Name" 
                                    onChange={(e) => {
                                        setUsersTask(e.value)     
                                        setbtnDisabled(false)                           
                                    }} 
                                    options={usersDropdownlist} 
                                    placeholder="Select User"  
                                    filter={true}
                                />
                            </div>
                        </div>
                    </Dialog>
        
        <h1></h1>
        <div className="card">
            <h3>Order Task</h3>
            <DataTable 
                value={users} 
                lazy 
                filterDisplay="row" 
                dataKey="tsk_FromLocationCode" 
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
                rowsPerPageOptions={[25, 50, 100, 500]}
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
                <Column field="tsk_FromLocationCode" header="From Location Code" body={(rowData) => rowData.tsk_FromLocationCode} sortable filter showFilterMenu={false} filterPlaceholder="Search" />           
                <Column field="tsk_ToLocationCode" header="To Location Code" body={(rowData) => rowData.tsk_ToLocationCode} sortable filter showFilterMenu={false} filterPlaceholder="Search" />               
                <Column field="ProductShortDescription" header="Item Description" body={(rowData) => rowData.productShortDescription} sortable filter showFilterMenu={false} filterPlaceholder="Search" />               
                <Column field="tsk_SSCC" header="SSCC" body={(rowData) => rowData.tsk_SSCC} sortable filter showFilterMenu={false} filterPlaceholder="Search" />
                <Column field="total_tasks" header="Total Task" body={(rowData) => rowData.total_Tasks}  />
                <Column field="ComboDescription" header="Product Pack Type" body={(rowData) => rowData.comboDescription} sortable filter showFilterMenu={false} filterPlaceholder="Search" />
                <Column field="total_qty" header="Quantity" body={(rowData) => rowData.total_Qty}  />
                <Column field="tsk_FinalLocationCode" header="Final Location Code" body={(rowData) => rowData.tsk_FinalLocationCode} sortable filter showFilterMenu={false} filterPlaceholder="Search" />
                <Column field="task_status"   header="Task Status" body={nameBodyTemplate} sortable filter showFilterMenu={false}  filterElement={OrderTypeRowFilterTemplate} />
                <Column field="assigned_user" header="Task Assigned User" body={(rowData) => rowData.assigned_user} sortable filter showFilterMenu={false} filterPlaceholder="Search" />
                <Column field="executed_user" header="Task Executed User" body={(rowData) => rowData.executed_user} sortable filter showFilterMenu={false} filterPlaceholder="Search" />
            
            </DataTable>
        </div>
        </>
        
    );
}
        