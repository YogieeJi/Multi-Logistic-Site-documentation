import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { OrdersImportService } from '../../../../service/outbound/OrdersImportService';
import { OrdersReAllocateService } from '../../../../service/outbound/OrderReallocateService';
import { Tag } from 'primereact/tag';
import { Badge } from 'primereact/badge';
import { SplitButton } from 'primereact/splitbutton';
import { Menu } from 'primereact/menu';
import { UserSettingService } from '../../../../service/settings/UserSettingService';
import { Dropdown } from 'primereact/dropdown';
import { LocationsService } from '../../../../service/misc/LocationsService';
import { MultiSelect } from 'primereact/multiselect';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import '../../../../assets/styles.css';
import { useLazySort } from "../../../../components/useLazySort";
import { useAuth } from '../../../../store/useAuth';


export default function OrderImport() {
    const {hasActionAccess} = useAuth();
        const PAGE_KEY = "outbound_orderReAllocation";
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [orders, setOrders] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedDelivery, setSelectedDelivery] =useState(() => {
        const savedSelection = localStorage.getItem("selectedOrders");
        return savedSelection ? JSON.parse(savedSelection) : [];});

    const [shippingLocations, setShippingLocations] = useState(null);
    const [selectedLocations, setSelectedLocations] = useState(null);
    const [selectedLocationLimit, setSelectedLocationLimit] = useState(3);

    const [laneslist, setLanesList] = useState(null);
    const [selectedLanes, setSelectedLanes] = useState(null);
    const [noOfPallets, setNoOfPallets] = useState(0);
    const [nextCursor, setNextCursor] = useState(null);
    const [prevCursor, setPrevCursor] = useState(null);
    const [dates, setDates] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const [displayConfirmation2, setDisplayConfirmation2] = useState(false);
    const [displayConfirmation3, setDisplayConfirmation3] = useState(false);
    const [displayConfirmation4, setDisplayConfirmation4] = useState(false);
    const [displayConfirmation5, setDisplayConfirmation5] = useState(false);
    const [displayConfirmation6, setDisplayConfirmation6] = useState(false);
    const [displayConfirmation7, setDisplayConfirmation7] = useState(false);
    const [displayConfirmation8, setDisplayConfirmation8] = useState(false);
    const [displayConfirmation9, setDisplayConfirmation9] = useState(false);
    const [displayConfirmation10, setDisplayConfirmation10] = useState(false);
    const [displayConfirmation11, setDisplayConfirmation11] = useState(false);
    const [displayConfirmation12, setDisplayConfirmation12] = useState(false);
    const [displayConfirmation13, setDisplayConfirmation13] = useState(false);
    const [displayConfirmation14, setDisplayConfirmation14] = useState(false);
    const [displayConfirmation15, setDisplayConfirmation15] = useState(false);
    const [displayConfirmation16, setDisplayConfirmation16] = useState(false);
    const [displayConfirmation17, setDisplayConfirmation17] = useState(false);
    const [displayConfirmation18, setDisplayConfirmation18] = useState(false);
    const [displayConfirmation19, setDisplayConfirmation19] = useState(false);
    const [cancelOrderDisplayConfirmation, setCancelOrderDisplayConfirmation] = useState(false);
    const [displayConfirmationRerun, setDisplayConfirmationRerun] = useState(false);
    const [displayConfirmationRerunPick, setDisplayConfirmationRerunPick] = useState(false);
    const [orderTypepopup, setOrderTypepopup] = useState(false);
    // const [globalFlags] = useState([ { code: '1', name: 'Yes' },
    // { code: '0', name: 'No' }]);
    // const [exportedFlags] = useState(['Pending', 'Partial','Completed','Failed', 'Skipped', 'Unexportable', 'Manual Complete']);
    const rowsOptions = [10, 25, 50, 100]; 
   
    const lvStatusFlags = [
        { code: 'Pending', name: 'Pending' },
        { code: 'Task Completed', name: 'Task Completed' },
        { code: 'Completed', name: 'Completed' },
        { code: 'In-Progress', name: 'In-Progress' },
        { code: 'Closed', name: 'Closed' },
    ];
   
    const orderTypeFlags = [
        {"name": "Regular","code": "ltl"},
        {"name": "Full Truck Load","code": "ftl"},
        {"name": "Transfer","code": "tr"},
        {"name": "Small Picking","code": "sp"},
    ];
    const getInvalidSeverity = (flag) => {
        switch (flag) {
            case 'Yes':
                return 'danger';

            case 'No':
                return 'success';
        }
    };

    const getLvStatusSeverity = (flag) => {
        switch (flag) {
            case 'Pending':
                return 'info';

            case 'Closed':
                return 'primary';

            case 'In-Progress':
                return 'primary';

            default:
                return 'success';
        }
    };

    const getSeverity = (flag) => {
        switch (flag) {
            case 'Yes':
                return 'success';

            case 'No':
                return 'danger';

            case 'Pending':
                return 'secondary';

            case 'Partial':
                return 'primary';

            case 'Completed':
                return 'success';

            case 'Failed':
                return 'danger';

            case 'Skipped':
                return 'warning';

            case 'Unexportable':
                return 'warning';

            case 'Manual Complete':
                return 'success';
            case 'Assigned':
                    return 'success';
            case 'Not Assigned':
                    return 'danger';
            case 'Released':
                return 'primary';
            case 'Partially Assigned':
                return 'info';
        }
    };

    const [assigntouseruom, setAssigntouseruom] = useState(null);
    // const orderTypeDropdownlist = [
    //     {"name": "Regular","value": "regular_order"},
    //     {"name": "Inter Transfer","value": "inter_transfer_order"},
    //     {"name": "Full Truck Load","value": "full_truck_load"},
    // ];
   
    const [usersDropdownlist, setUsersDropdownlist] = useState(null);
    const [selectedOrderType, setSelectedOrderType] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [assignSelectedOrderType, setassignSelectedOrderType] = useState(null);
    const [orderAssignTypeDropdownlist, setOrderAssignTypeDropdownlist] = useState(null);
    

    const [templateUrl, setTemplateUrl] = useState(false);
    const [bulkOrderTemplateUrl, setBulkOrderTemplateUrl] = useState(false);
    const [btnDisabled, setbtnDisabled] = useState(true);

    let data = {};
    let fileRef = useRef();
    const menuLeft = useRef(null);
    
    const toast = useRef();

    const [rowsPerPage, setRowsPerPage] = useState(() => {
        return parseInt(localStorage.getItem("rowsPerPage"), 10) || 10;})
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            
            ord_StatusID: { value: null, matchMode: 'contains' },
            ord_CustomerOrderCode: { value: null, matchMode: 'contains' },
            ord_LineCount: { value: null, matchMode: 'contains' },
            ord_Code: { value: null, matchMode: 'contains' },
            ord_InputDate: { value: null, matchMode: 'contains' },
        }
    });
    
    const { onSort } = useLazySort(setlazyState);


    const actionItems = [
        {
            label: 'Sync Details',
            icon: 'pi pi-sync',
            command: () => {
                if(selectedDelivery != null && selectedDelivery.length == 1){
                    onclick(setDisplayConfirmation9(true))
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Please select 1 order only' });
                }
            }
        },
        {
            // label: 'Create Delivery',
            label: 'Export Order',
            icon: 'pi pi-plus',
            command: () => {
                if(selectedDelivery != null && selectedDelivery.length > 0){
                    onclick(setDisplayConfirmation3(true))
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        {
            label: 'Rerun Export Order',
            icon: 'pi pi-plus',
            command: () => {
                console.log(selectedDelivery)
                if (selectedDelivery != null && selectedDelivery.length > 0) {
                    onclick(setDisplayConfirmationRerun(true));
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'At least select 1 order' });
                }
            }
        },
        {
            label: 'Get PickList Detail',
            icon: 'pi pi-plus',
            command: () => {
                console.log(selectedDelivery)
                if (selectedDelivery != null && selectedDelivery.length > 0) {
                    onclick(setDisplayConfirmationRerunPick(true));
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'At least select 1 order' });
                }
            }
        },
        {
            label: 'Mark as Manual Complete',
            icon: 'pi pi-plus',
            command: () => {
                if(selectedDelivery != null && selectedDelivery.length > 0){
                    onclick(setDisplayConfirmation10(true))
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        {
            label: 'Check Order Status',
            icon: 'pi pi-plus',
            command: () => {
                if(selectedDelivery != null && selectedDelivery.length > 0){
                    onclick(setDisplayConfirmation11(true))
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        {
            label: 'Release Shipment Location',
            icon: 'pi pi-map',
            command: () => {
 
                if(selectedDelivery != null ){
                    onclick(setDisplayConfirmation12(true))
                }
                else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
                
            }
        },
        {
            label: 'Assign Order Type',
            icon: 'pi pi-plus',
            command: () => {
                if(selectedDelivery != null && selectedDelivery.length > 0){
                   
                    setOrderTypepopup(true) 
                    
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        {
            label: 'Assign User Loc for Case',
            icon: 'pi pi-user',
            command: () => {
                if(selectedDelivery != null && selectedDelivery.length == 1){
                    getShippingLocations(selectedDelivery)
                    setSelectedLocations(null) 
                    
                    setSelectedUser(null)     
                    setbtnDisabled(true) 
                    setAssigntouseruom('cs')
                    onclick(setDisplayConfirmation7(true))
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        {
            label: 'Assign User Loc for Pallet',
            icon: 'pi pi-user',
            command: () => {
                if(selectedDelivery != null && selectedDelivery.length == 1){
                    getShippingLocations(selectedDelivery)
                    setSelectedLocations(null)  

                    setSelectedUser(null)     
                    setbtnDisabled(true) 
                    setAssigntouseruom('pallet')
                    onclick(setDisplayConfirmation7(true))
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        {
            label: 'Delete',
            icon: 'fa fa-trash',
            command: () => {
                if(selectedDelivery != null && selectedDelivery.length == 1){
                    setbtnDisabled(true) 
                    onclick(setDisplayConfirmation17(true))
                } 
                if(selectedDelivery != null && selectedDelivery.length > 1){
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'You cannot select multiple orders at a time.' });
                }else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        {
            label: 'Assign To Lanes',
            icon: 'pi pi-map-marker',
            command: () => {
                if(selectedDelivery != null && selectedDelivery.length > 0){
                    getLanes()

                    setNoOfPallets(0)
                    getAllOrderPalletsCount()

                    setSelectedLanes(null)  
                    
                    setbtnDisabled(true) 
                    onclick(setDisplayConfirmation6(true))
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        {
            label: 'Load Orders',
            icon: 'pi pi-sync',
            command: () => {
                if(selectedDelivery != null && selectedDelivery.length > 0){
                    setbtnDisabled(true) 
                    onclick(setDisplayConfirmation8(true))
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Please select 1 order' });
                }
            }
        },
        {
            label: 'Re-execute Order',
            icon: 'pi pi-sync',
            command: () => {
                if(selectedDelivery != null && selectedDelivery.length > 0){
                    setbtnDisabled(true) 
                    onclick(setDisplayConfirmation14(true))
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        {
            label: 'Append Order',
            icon: 'pi pi-sync',
            command: () => {
                if(selectedDelivery != null && selectedDelivery.length > 0){
                    setbtnDisabled(true) 
                    onclick(setDisplayConfirmation15(true))
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        {
            label: 'Mark as not re-execute',
            icon: 'pi pi-sync',
            command: () => {
                if(selectedDelivery != null && selectedDelivery.length > 0){
                    setbtnDisabled(true) 
                    onclick(setDisplayConfirmation18(true))
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        {
            label: 'Archive Completed Orders',
            icon: 'fa-regular fa-file-zipper',
            command: () => {
                
                onclick(setDisplayConfirmation16(true))
               
            }
        },
        {
            label: 'Cancel Order',
            icon: 'fa fa-times',
            command: () => {
                if(selectedDelivery != null && selectedDelivery.length > 0){
                    onclick(setCancelOrderDisplayConfirmation(true))
                }
                else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select atleast 1 order' });
                }
            }    
        },
    ];

    const items = [{ label: 'Orders' }, { label: 'Order Reallocation'}];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;

    const getStatusSeverity = (status) => {
        if(status){
            if(status.includes('1-')){
                return 'primary';
            } else if(status.includes('3-')){
                return 'success';
            } else{
                return 'info';
            }
        }
    };

    useEffect(() => {
       
    }, []);

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);
  

     const pickList = () => {

        OrdersImportService.getOrdersList( ).then((data) => {
            
        });
    }
     

    const loadLazyData = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            OrdersReAllocateService.getOrdersGrid( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setOrders(data.data);
                setLoading(false)
            });
        }, Math.random() * 100 + 250);

        UserSettingService.getMantisUsers().then((data) => {
           
            if(data.error == 0){
                setUsersDropdownlist(data.data);
            }
        });
        OrdersImportService.getOrderTypes().then((data) => {
            
            setOrderAssignTypeDropdownlist(data.data);
            
        });
        

    };

    const getShippingLocations = (selectedDelivery) => {
        OrdersImportService.getOrderPalletsCount( (selectedDelivery) ).then((data) => {
            if(data.data == '0'){
                setSelectedLocationLimit(1);
            } else{
                setSelectedLocationLimit(data.data); 
            }
            
        });
        LocationsService.getShippingLocations((selectedDelivery)).then((data) => {
            // setLoading(false);
            if(data.error == 0){
                setShippingLocations(data.data);
                setSelectedLocations(data.selectedLocations)
            }
        });
    }

    const getAllOrderPalletsCount = () => {
        OrdersImportService.getAllOrderPalletsCount((selectedDelivery)).then((data) => {
            if(data.error == 0){
                setNoOfPallets(data.data);
            }
        });
    }

    const getLanes = () => {
        LocationsService.getLanes().then((data) => {
            if(data.error == 0){
                setLanesList(data.data);
                setSelectedLanes(data.selectedLanes)
            }
        });
    }
    const handleNext = (event) => {
        setlazyState(prevState => ({
            ...prevState,    
            first: nextCursor,
        }));
        
        
    };
    
  
        
  
    const onPage = (event) => {
        setlazyState(event);
    };

    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };

    const onSelectionChange = (event) => {
        const value = event.value;
        // console.log(value)
        setSelectedDelivery(value);
        setSelectAll(value.length === totalRecords);

        localStorage.setItem("selectedOrders", JSON.stringify(value));
      
        if (value.length === 0) {
            // Remove the next_cursor from localStorage when unchecking all
            localStorage.removeItem('next_cursor');
        } else {
            // Otherwise, store the next_cursor value in localStorage
            localStorage.setItem('next_cursor', nextCursor);
        }

    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            // OrdersImportService.getOrdersGrid().then((data) => {
                setSelectAll(true);
                setSelectedDelivery(orders);
            // });
        } else {
            setSelectAll(false);
            setSelectedDelivery([]);
        }
        
    };


    const lv_statusBodyTemplate = (rowData) => {
        return (
            <>
                <Tag value={rowData.ord_StatusID} severity={getLvStatusSeverity(rowData.ord_StatusID)} />
            </>
        );
    };

    const reExecuteBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.ord_StatusID == 2)?<Badge value="Executing" severity="warning"></Badge> : <Badge value="-" severity="secondary"></Badge> }
            </>
        );
    };

   
    
    const is_exportedBodyTemplate = (rowData) => {
        if(rowData.is_exported == 1){
            return (
                <>
                    {<Badge value="Partial"></Badge>}
                </>
            );
        } else if(rowData.is_exported == 2){
            return (
                <>
                    {<Badge value="Completed" severity="success"></Badge>}
                </>
            );
        } else if(rowData.is_exported == 3){
            return (
                <>
                    {<Badge value="Failed" severity="danger"></Badge>}
                </>
            );
        } else if(rowData.is_exported == 4){
            return (
                <>
                    {<Badge value="Skipped" severity="warning"></Badge>}
                </>
            );
        } else if(rowData.is_exported == 5){
            return (
                <>
                    {<Badge value="Unexportable" severity="warning"></Badge>}
                </>
            );
        } else if(rowData.is_exported == 6){
            return (
                <>
                    {<Badge value="Manual Complete" severity="success"></Badge>}
                </>
            );
        } else{
            return (
                <>
                    {<Badge value="Pending" severity="secondary"></Badge>}
                </>
            );
        }
        
    };
    

    const flagTemplate = (option) => {
        return <Badge value={option.name} severity={getSeverity(option.name)} />;
    };
    const invalidFlagTemplate = (option) => {
        return <Badge value={option.name} severity={getInvalidSeverity(option.name)} />;
    };
    const lvStatusflagTemplate = (option) => {
        return <Badge value={option.name} severity={getLvStatusSeverity(option.name)} />;
    };

    const lvStatusRowFilterTemplate = (options) => {
        return (
            <Dropdown  style={{ minWidth: '3em', width: '5em' }}  value={options.name} optionValue="code" optionLabel="name"  options={lvStatusFlags} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={lvStatusflagTemplate} placeholder="Select One" className="p-column-filter" showClear  />
        );
    };
   
    

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                {/* <SplitButton label="Create Delivery" icon="pi pi-plus" onClick={() => setDisplayConfirmation3(true)} model={actionItems} /> */}
                {/* <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" /> */}
                <Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />

                {/* <Button label="Create Delivery" icon="pi pi-plus" severity="sucess" className='mr-3' onClick={() => setDisplayConfirmation3(true)} /> */}
                {/* <Button label="Execute Orders" icon="pi pi-sync" severity="sucess" onClick={() => setDisplayConfirmation2(true)} /> */}
            </span>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <Button label="Sync Order" icon="pi pi-upload" severity="secondary" onClick={() => pickList()} />
                <Button label="Upload" icon="pi pi-upload" severity="secondary" onClick={() => setDisplayConfirmation(true)} />
                &nbsp;<Button label="Bulk Load Order" icon="pi pi-upload" severity="secondary" onClick={() => setDisplayConfirmation19(true)} />
            </span>
            
        </div>
    );

    const fileUploadHandler = ({files}) => {
        const [file] = files;
        uploadFile(file);
    };
    const loadOrderfileUploadHandler = ({files}) => {
        const [file] = files;
        uploadLoadOrderFile(file);
    };
    const uploadLoadOrderFile = async (inputFile) => {
         
        let formData = new FormData();
       
        formData.append('test', 'inputFile');
        formData.append('inputFile', inputFile);
        console.log(Object.fromEntries(formData));
        fileRef.clear();
        setLoading(true);
        setDisplayConfirmation19(false);
        OrdersImportService.loadOrderUploadData( formData ).then((data) => {
            if(data.error == 0){
                
                toast.current.show({ severity: 'success', summary: 'File Upload', detail: data.message});
                loadLazyData()                

            } else{
                toast.current.show({ severity: 'error', summary: 'File Upload', detail: data.message, sticky: true});
                networkTimeout = setTimeout(() => {
                   toast.current.clear();
                }, 3000);
            }
           
        });
    };
    const uploadFile = async (inputFile) => {
        
        let formData = new FormData();
        formData.append('inputFile', inputFile);

        // console.log(formData)
        fileRef.clear();
        setLoading(true);
        setDisplayConfirmation(false);
        OrdersImportService.uploadData( formData ).then((data) => {
            if(data.error == 0){
                
                toast.current.show({ severity: 'success', summary: 'File Upload', detail: data.message});

                loadLazyData() 
              

                

            } else{
                toast.current.show({ severity: 'error', summary: 'File Upload', detail: data.message, sticky: true});
                networkTimeout = setTimeout(() => {
                   toast.current.clear();
                }, 3000);
            }
           
        });
    };

    const orderExecution = () => {
        setDisplayConfirmation2(false)
        setLoading(true);
        // console.log(selectedDelivery);
        OrdersImportService.orderExecution(selectedDelivery).then((data) => {
            setLoading(false);
            if(data.error == 0){
                loadLazyData();
                setSelectAll(false);
                setSelectedDelivery([]);
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else{
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    }

    const deliveryCreation = () => {
        setDisplayConfirmation3(false)
        setLoading(true);
        const payload = {
            orders: selectedDelivery,
        };
        // console.log(selectedDelivery);
        OrdersImportService.deliveryCreation(payload).then((data) => {
            setLoading(false);
            if(data.error == 0){
                // loadLazyData();
                setSelectAll(false);
                setSelectedDelivery([]);
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else{
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    }
    const cancelOrders = () => {
        setCancelOrderDisplayConfirmation(false)
        setLoading(true);
        // console.log(selectedDelivery);
        const pick_list_ids = selectedDelivery.map(item => item.pick_list_id);
        const data = {ids : pick_list_ids}
        OrdersImportService.cancelOrders(data).then((data) => {
            setLoading(false);
            if(data.error == 0){
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else{
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    }
    const orderLoad = () => {
        setDisplayConfirmation8(false)
        setLoading(true);
        
        OrdersImportService.orderLoad(selectedDelivery).then((data) => {
            setLoading(false);
            if(data.error == 0){
                loadLazyData();
                setSelectAll(false);
                setSelectedDelivery([]);
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else{
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    }

    const confirmationDialogFooter = (
        <>
            
            <Button type="button" label="Close" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
        </>
    );
    const confirmationDialogFooter19 = (
        <>
            
            <Button type="button" label="Close" icon="pi pi-times" onClick={() => setDisplayConfirmation19(false)} className="p-button-text" />
        </>
    );
    
    const confirmationDialogFooter2 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation2(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => orderExecution()} className="p-button-text" autoFocus />
        </>
    );
    const cancelOrderConfirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setCancelOrderDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => cancelOrders()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter3 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation3(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => deliveryCreation()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter4 = (
        <div>
            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitUser()} />
        </div>
    );

    const confirmationDialogFooter5 = (
        <div>
            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitLocation()} />
        </div>
    );

    const confirmationDialogFooter6 = (
        <div>
            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitLanes()} />
        </div>
    );

    const confirmationDialogFooter7 = (
        <div>
            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitUserLoc()} />
        </div>
    );

    const confirmationDialogFooter8 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation8(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => orderLoad()} className="p-button-text" autoFocus />
        </>
    );

    const confirmationDialogFooter9 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation9(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => manualDetailsSync()} className="p-button-text" autoFocus />
        </>
    );

    const confirmationDialogFooter10 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation10(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => markOrderManualComplete()} className="p-button-text" autoFocus />
        </>
    );

    const confirmationDialogFooter11 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation11(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => markOrderStatusComplete()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter12 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation12(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => releaseLoction()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter13 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation13(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => releaseLoction(true)} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter14 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation14(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => reexecuteOrder()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter15 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation15(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => appendOrder()} className="p-button-text" autoFocus />
        </>
    );
    
    const confirmationDialogFooter16 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation16(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => archiveCompeletedOrder()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter17 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation17(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => deleteOrder()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter18 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation18(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => markNotReRun()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooterRerun = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmationRerun(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => rerunFailedJobs()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooterRerunPick = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmationRerunPick(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => PickListDetail()} className="p-button-text" autoFocus />
        </>
    );
    const multiselectFooterTemplate = () => {
        const length = selectedLocations ? selectedLocations.length : 0;

        return (
            <div className="py-2 px-3">
                <b>{length}</b> item{length > 1 ? 's' : ''} selected.
            </div>
        );
    };

    const manualDetailsSync = () => {

        // setbtnDisabled(true);
        data = {
            order: selectedDelivery,
        }
        // console.log(data)
        setDisplayConfirmation9(false)
        setLoading(true);

        OrdersImportService.manualDetailsSync( (data) ).then((data) => {
            // setbtnDisabled(false);
            
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            } 
            else{
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            
            setLoading(false);

        });
        
    };

    const onSubmitUser = () => {

        setbtnDisabled(true);
        data = {
            orders: selectedDelivery,
            user: selectedUser,
            uom: assigntouseruom,
        }
        // console.log(data)
        OrdersImportService.assignUser( (data) ).then((data) => {
            setLoading(false);
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setSelectAll(false);
                setSelectedDelivery([]);
                // getItems(zoneDetail.zon_Description);
            } 
            else{
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setbtnDisabled(false);
            setDisplayConfirmation4(false)
        });
        
    };
    const picklist_idBodyTemplate = (rowData) => {
        return (
            <>
                <Link to={`${rowData.ord_ID}/${rowData.ord_Code}`}>{rowData.ord_Code}</Link>
            </>
        );
    };

    const onSubmitUserLoc = () => {

        
        setbtnDisabled(true);
        data = {
            orders: selectedDelivery,
            user: selectedUser,
            uom: assigntouseruom,
            locations: selectedLocations,
            no_of_pallets: selectedLocationLimit,
            order_type: selectedOrderType,
            assigned_type: 1,
        }
        // console.log(data)
        OrdersImportService.assignUserLoc( (data) ).then((data) => {
            setLoading(false);
            
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
                // getItems(zoneDetail.zon_Description);
            } 
            else{
                setSelectAll(false);
                setSelectedDelivery([]);
                setbtnDisabled(false);
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setbtnDisabled(false);
            setDisplayConfirmation7(false)
        });
        
    };
    
    const onSubmitLocation = () => {

        setbtnDisabled(true);
        data = {
            order: selectedDelivery,
            locations: selectedLocations,
        }
        // console.log(data)
        OrdersImportService.assignLocations( (data) ).then((data) => {
            setLoading(false);
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
                // getItems(zoneDetail.zon_Description);
            } 
            else{
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setbtnDisabled(false);
            setDisplayConfirmation5(false)
        });
        
    };

    const onSubmitLanes = () => {

        setbtnDisabled(true);
        data = {
            order: selectedDelivery,
            lanes: selectedLanes,
        }
        OrdersImportService.assignLanes( (data) ).then((data) => {
            setLoading(false);
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            } 
            else{
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setbtnDisabled(false);
            setDisplayConfirmation6(false)
        });
        
    };

    const markOrderManualComplete = () => {
        setLoading(true);
        setbtnDisabled(true);
        data = {
            orders: selectedDelivery,
        }
        
        setDisplayConfirmation10(false)
        OrdersImportService.manualOrderComplete( (data) ).then((data) => {
            
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            } 
            else{
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setLoading(false);
            setbtnDisabled(false);
            
        });
    };
    
    const releaseLoction = (flag = false) => {
      
        setLoading(true);
        setbtnDisabled(true);
        if(selectedDelivery[0].is_location_assigned == 0){
            setLoading(false);
            setbtnDisabled(false);
            setDisplayConfirmation12(false)
            toast.current.show({ severity: 'error', summary: 'Error', detail: "Location is not assigned."});
            return false;
        }
        data = {
            order: selectedDelivery[0],
            flag : flag
        }
        
        setDisplayConfirmation12(false);
        setDisplayConfirmation13(false);
        OrdersImportService.releaseLoction( (data) ).then((data) => {
            
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            } 
            else{
                if(data?.code == 409){
                    setLoading(false);
                    setbtnDisabled(false);
                    setDisplayConfirmation13(true);
                }
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setLoading(false);
            setbtnDisabled(false);
            
        });
    };
    
    const reexecuteOrder = () => {
      
        setLoading(true);
        setbtnDisabled(true);
        
        data = {
            orders: selectedDelivery,
        }
        
        
        OrdersImportService.reexecuteOrder( (data) ).then((data) => {
            
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            } 
            else{
                if(data?.code == 409){
                    setLoading(false);
                    setbtnDisabled(false);
                     
                }
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setDisplayConfirmation14(false);
            setLoading(false);
            setbtnDisabled(false);
            
        });
    };
    
    const markNotReRun = () => {
      
        setLoading(true);
        setbtnDisabled(true);
        
        data = {
            orders: selectedDelivery,
        }
        
        
        OrdersImportService.markNotReRun( (data) ).then((data) => {
            
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            } 
            else{
                if(data?.code == 409){
                    setLoading(false);
                    setbtnDisabled(false);
                     
                }
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setDisplayConfirmation18(false);
            setLoading(false);
            setbtnDisabled(false);
            
        });
    };
    const archiveCompeletedOrder = () => {
        
        setLoading(true);
        setbtnDisabled(true);
        OrdersImportService.archiveCompeletedOrder().then((data) => {
            
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            } 
            else{
                
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setDisplayConfirmation16(false);
            setLoading(false);
            setbtnDisabled(false);
            
        });
    }
    
    const deleteOrder = () => {
        
        setLoading(true);
        setbtnDisabled(true);
        const ids = selectedDelivery.map(item => item.id);
        const data = {order_id:ids};
       
        OrdersImportService.deleteOrder((data)).then((data) => {
            
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            } 
            else{
                
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setDisplayConfirmation17(false);
            setLoading(false);
            setbtnDisabled(false);
            
        });
    }
    const appendOrder = () => {
      
        setLoading(true);
        setbtnDisabled(true);
        
        data = {
            orders: selectedDelivery,
        }
        
        
        OrdersImportService.appendOrders( (data) ).then((data) => {
            
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            } 
            else{
                if(data?.code == 409){
                    setLoading(false);
                    setbtnDisabled(false);
                     
                }
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setDisplayConfirmation15(false);
            setLoading(false);
            setbtnDisabled(false);
            
        });
    };
    
    const assignOrderTypeFun = () => {
        
        if(assignSelectedOrderType === undefined || assignSelectedOrderType == null || assignSelectedOrderType.length <= 0){
            toast.current.show({ severity: 'error', summary: 'Error', detail: "Select Order Type"});
            return false;
        }
        setLoading(true);
        
        data = {
            orders: selectedDelivery,
            order_type: assignSelectedOrderType
        }
        
        setOrderTypepopup(false)
        OrdersImportService.assignOrderType( (data) ).then((data) => {
            
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setSelectAll(false);
                setSelectedDelivery([]);
                setassignSelectedOrderType(null);
                loadLazyData();
            } 
            else{
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setLoading(false);
            
            
        });
    };

    const markOrderStatusComplete = () => {
        setLoading(true);
        setbtnDisabled(true);
        data = {
            orders: selectedDelivery,
        }
        
        setDisplayConfirmation11(false)
        OrdersImportService.orderStatusComplete( (data) ).then((data) => {
            
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            } 
            else{
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setLoading(false);
            setbtnDisabled(false);
            
        });
    };
   
    const rerunFailedJobs = () => {
        setLoading(true);
        const payload = {
            orders: selectedDelivery,
            failJobs : 'fail-jobs'
        };
    
        OrdersImportService.deliveryCreation(payload).then((data) => {
            setLoading(false);
            if (data.error === 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            } else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setDisplayConfirmationRerun(false);
        });
    };
    const PickListDetail = () => {
        setLoading(true);
        const payload = {
            orders: selectedDelivery.map(order => order.pick_list_id)
        };
    
        OrdersImportService.getPickListDetail(payload).then((data) => {
            setLoading(false);
            if (data.error === 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            } else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setDisplayConfirmationRerunPick(false);
        });
    };
    return (
        <>
        <Helmet>
            <title>Orders</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
        <Dialog header="Upload" visible={displayConfirmation19} onHide={() => setDisplayConfirmation19(false)} style={{ width: '550px' }} modal footer={confirmationDialogFooter19}>
            <Link to={bulkOrderTemplateUrl} >Download Template</Link>
            <h1></h1>
            <FileUpload name="file[]"
                    ref={(el) => fileRef = el}
                    customUpload={true}
                    uploadHandler={loadOrderfileUploadHandler}
                    accept=".xls,.csv,.xlsx" 
                    maxFileSize={10000000000} 
                    emptyTemplate={<p className="m-0">Drag and drop file here to upload.</p>} 
                />
        </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmationRerun} onHide={() => setDisplayConfirmationRerun(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooterRerun}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to rerun the failed jobs?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmationRerunPick} onHide={() => setDisplayConfirmationRerunPick(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooterRerunPick}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to get the Picklist details?</span>
                </div>
            </Dialog>
        <Dialog header="Upload" visible={displayConfirmation} onHide={() => setDisplayConfirmation(false)} style={{ width: '550px' }} modal footer={confirmationDialogFooter}>
            <Link to={templateUrl} >Download Template</Link>
            <h1></h1>
            <FileUpload name="file[]"
                    ref={(el) => fileRef = el}
                    customUpload={true}
                    uploadHandler={fileUploadHandler}
                    accept=".xls,.csv,.xlsx" 
                    maxFileSize={10000000000} 
                    emptyTemplate={<p className="m-0">Drag and drop file here to upload.</p>} 
                />
        </Dialog>
        <Dialog header="Confirmation" visible={displayConfirmation2} onHide={() => setDisplayConfirmation2(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter2}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
        </Dialog>
        <Dialog header="Confirmation" visible={cancelOrderDisplayConfirmation} onHide={() => cancelOrderDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={cancelOrderConfirmationDialogFooter}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
        </Dialog>
        <Dialog header="Confirmation" visible={displayConfirmation9} onHide={() => setDisplayConfirmation9(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter9}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
        </Dialog>
        <Dialog header="Confirmation" visible={displayConfirmation3} onHide={() => setDisplayConfirmation3(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter3}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
        </Dialog>
        <Dialog header="Select Order Type" visible={orderTypepopup} onHide={() => setOrderTypepopup(false)} style={{ width: '350px' }} modal>
            <div className="flex align-items-center justify-content-center">
                
                        <Dropdown 
                            style={{marginRight:5, marginLeft:10}} 
                            value={assignSelectedOrderType}
                            optionValue="id" 
                            optionLabel="order_type" 
                            onChange={(e) => {
                                setassignSelectedOrderType(e.value)     
                                                        
                            }} 
                            options={orderAssignTypeDropdownlist} 
                            placeholder="Select Order Type"  
                            filter={true}
                        />

                    <span className="block mt-2 md:mt-0 p-input-icon-left">
                        <Button label="Assign" icon="pi pi-plus" severity="secondary" onClick={() => assignOrderTypeFun()} />
                    </span>
            </div>
        </Dialog>
        <Dialog header="Assign Locations" visible={displayConfirmation5} style={{ width: '50vw' }} onHide={() => setDisplayConfirmation5(false)} footer={confirmationDialogFooter5}>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-9">
                        <label>No of Pallets*</label>
                        <InputNumber  
                            value={selectedLocationLimit} 
                            min={1}
                            onChange={(e) => {
                                setSelectedLocationLimit(e.value)
                            }} 
                            required={true}
                        />
                    </div>
                    <div className="field col-12 md:col-9">
                        <label>Locations*</label>
                        <MultiSelect  
                            // style={{marginRight:5, marginLeft:10}} 
                            value={selectedLocations}
                            optionValue="id" 
                            optionLabel="loc_Code" 
                            display="comma"
                            onChange={(e) => {
                                setSelectedLocations(e.value)
                                setbtnDisabled(false) 
                            }} 
                            panelFooterTemplate={multiselectFooterTemplate}
                            options={shippingLocations} 
                            placeholder="Select Locations"  
                            filter={true}
                            selectionLimit={selectedLocationLimit}
                            showSelectAll={false}
                            // optionDisabled={}
                        />
                    </div>
                </div>
            </Dialog>
        <Dialog header="Assign User" visible={displayConfirmation4} style={{ width: '50vw' }} onHide={() => setDisplayConfirmation4(false)} footer={confirmationDialogFooter4}>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-9">
                        <label>Users*</label>
                        <Dropdown 
                            style={{marginRight:5, marginLeft:10}} 
                            value={selectedUser}
                            optionValue="emp_ID" 
                            optionLabel="Name" 
                            onChange={(e) => {
                                setSelectedUser(e.value)     
                                setbtnDisabled(false)                           
                            }} 
                            options={usersDropdownlist} 
                            placeholder="Select User"  
                            filter={true}
                        />
                    </div>
                </div>
            </Dialog>

            <Dialog header="Assign User" visible={displayConfirmation7} style={{ width: '50vw' }} onHide={() => setDisplayConfirmation7(false)} footer={confirmationDialogFooter7}>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-9">
                        <label>Users*</label>
                        <Dropdown 
                            style={{marginRight:5, marginLeft:10}} 
                            value={selectedUser}
                            optionValue="emp_ID" 
                            optionLabel="Name" 
                            onChange={(e) => {
                                setSelectedUser(e.value)     
                                setbtnDisabled(false)                           
                            }} 
                            options={usersDropdownlist} 
                            placeholder="Select User"  
                            filter={true}
                        />
                    </div>
                    {(selectedDelivery == null || selectedDelivery.length == 0 || ( selectedDelivery[0].is_location_assigned == 0 || selectedDelivery[0].is_location_assigned == 3) ) ?
                    <div className="field col-12 md:col-9">
                        <label>No of Pallets*</label>
                        <InputNumber  
                            value={selectedLocationLimit} 
                            min={1}
                            onChange={(e) => {
                                setSelectedLocationLimit(e.value)
                            }} 
                            required={true}
                        />
                    </div>
                    : ''}
                    {/* <div className="field col-12 md:col-9">
                        <label>Order Type*</label>
                        <Dropdown 
                            style={{marginRight:5, marginLeft:10}} 
                            value={selectedOrderType}
                            optionValue="order_type_code" 
                            optionLabel="order_type" 
                            onChange={(e) => {
                                setSelectedOrderType(e.value)     
                                setbtnDisabled(false)                           
                            }} 
                            options={orderAssignTypeDropdownlist} 
                        
                            filter={true}
                        />
                    </div> */}
                    {(selectedDelivery == null || selectedDelivery.length == 0 || selectedDelivery[0].is_location_assigned == 0) ?
                    // <div className="field col-12 md:col-9">
                    //     <label>Locations*</label>
                    //     <MultiSelect  
                    //         // style={{marginRight:5, marginLeft:10}} 
                    //         value={selectedLocations}
                    //         optionValue="id" 
                    //         optionLabel="loc_Code" 
                    //         display="comma"
                    //         onChange={(e) => {
                    //             setSelectedLocations(e.value)
                    //             setbtnDisabled(false) 
                    //         }} 
                    //         panelFooterTemplate={multiselectFooterTemplate}
                    //         options={shippingLocations} 
                    //         placeholder="Select Locations"  
                    //         filter={true}
                    //         selectionLimit={selectedLocationLimit}
                    //         showSelectAll={false}
                    //         // optionDisabled={}
                    //     />
                    // </div>
                    <span></span>
                    : ''}
                </div>
            </Dialog>

            <Dialog header="Assign Lanes" visible={displayConfirmation6} style={{ width: '50vw' }} onHide={() => setDisplayConfirmation6(false)} footer={confirmationDialogFooter6}>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-9">
                        <p>Number of Pallets: <b>{noOfPallets}</b></p>

                        <label>Lanes*</label>
                        <MultiSelect  
                            // style={{marginRight:5, marginLeft:10}} 
                            value={selectedLanes}
                            optionValue="lane" 
                            optionLabel="lane_count" 
                            display="chip"
                            onChange={(e) => {
                                setSelectedLanes(e.value)
                                setbtnDisabled(false) 
                            }} 
                            panelFooterTemplate={multiselectFooterTemplate}
                            options={laneslist} 
                            placeholder="Select Lanes"  
                            filter={true}
                            showSelectAll={false}
                            // optionDisabled={}
                        />
                    </div>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation8} onHide={() => setDisplayConfirmation8(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter8}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation10} onHide={() => setDisplayConfirmation10(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter10}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
        </Dialog>
        <Dialog header="Confirmation" visible={displayConfirmation11} onHide={() => setDisplayConfirmation11(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter11}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
        </Dialog>
        <Dialog header="Confirmation" visible={displayConfirmation12} onHide={() => setDisplayConfirmation12(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter12}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
        </Dialog>
        <Dialog header="Confirmation" visible={displayConfirmation14} onHide={() => setDisplayConfirmation14(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter14}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
        </Dialog>
        <Dialog header="Confirmation" visible={displayConfirmation15} onHide={() => setDisplayConfirmation15(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter15}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
        </Dialog>
        <Dialog header="Confirmation" visible={displayConfirmation16} onHide={() => setDisplayConfirmation16(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter16}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
        </Dialog>
        <Dialog header="Confirmation" visible={displayConfirmation17} onHide={() => setDisplayConfirmation17(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter17}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
        </Dialog>
        <Dialog header="Confirmation" visible={displayConfirmation18} onHide={() => setDisplayConfirmation18(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter18}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
        </Dialog>
        <Dialog header="Confirmation" visible={displayConfirmation13} onHide={() => setDisplayConfirmation13(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter13}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Order is not completely transferred! Do you still want to release shipment locations?</span>
            </div>
        </Dialog>
        <h1></h1>
        <div className="card">
            <h3>Orders</h3>
            <DataTable 
                value={orders} 
                lazy 
                filterDisplay="row" 
                dataKey="ord_ID" 
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
                emptyMessage="No record found."
                selection={selectedDelivery} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                scrollable 
                scrollHeight="600px"
                
            >
                
                <Column field="ord_Code" header="PickList ID"  body={picklist_idBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                {/* <Column field="ord_LineCount"  header="No. of Lines" headerStyle={{ width: '4rem' }} body={(rowData) => rowData.ord_LineCount} /> */}
                <Column field="ord_CustomerOrderCode" sortable  header="Customer Code" body={(rowData) => rowData.ord_CustomerOrderCode} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="ord_InputDate" sortable  header="Input Date" body={(rowData) => rowData.ord_InputDate} showFilterMenu={false} filter filterPlaceholder="Search" />
    

                <Column field="ord_StatusID"  header="Status" body={reExecuteBodyTemplate} showFilterMenu={false} />

                
                
            </DataTable>
        </div>
        </>
        
    );
}
        