
import React, { useState, useEffect , useRef} from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useParams,useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Tag } from 'primereact/tag';
import { Menu } from 'primereact/menu';
import { Sidebar } from 'primereact/sidebar';
import { Timeline } from 'primereact/timeline';
import { GeneralService } from '../../../../service/inbound/GeneralService';
import { Dialog } from 'primereact/dialog';
import { PicklistService } from '../../../../service/outbound/PicklistService';
import { OrdersImportService } from '../../../../service/outbound/OrdersImportService';
import { Badge } from 'primereact/badge';
import { TabView, TabPanel } from 'primereact/tabview';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { UserSettingService } from '../../../../service/settings/UserSettingService';
import OrderMenu from '../OrderMenu';
import * as xlsx from 'xlsx';
import * as FileSaver from 'file-saver';
import { useLazySort } from "../../../../components/useLazySort";
import OrderImport from '../grid';
import { useAuth } from '../../../../store/useAuth';


export default function PickListDetails() {
    const {hasActionAccess} = useAuth();
         const PAGE_KEY = "order_details";
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pickList, setPickList] = useState(null);
    const [pickListDetail, setPickListDetail] = useState({
        'created_at': '-',
        'fcy': '-'
    });
    const [usersDropdownlist, setUsersDropdownlist] = useState(null);
    const [assigntouseruom, setAssigntouseruom] = useState(null);
    const [pickListLines, setPickListLines] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedPickListLines, setSelectedPickListLines] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [palletSelectedUser, setPalletSelectedUser] = useState(null);
    const [btnDisabled, setbtnDisabled] = useState(true);
    const menuLeft = useRef(null);
    const [revalidateBtnDisabled, setrevalidateBtnDisabled] = useState(true);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const [displayConfirmation7, setDisplayConfirmation7] = useState(false);
    const [statusValue, setStatusValue] = useState(null);
    const globalFlags = [
        { code: '0', name: 'Yes' },
        { code: '1', name: 'No' },
    ];
    const navigate = useNavigate();
    const exportFlags = [
        { code: '1', name: 'Success' },
        { code: '2', name: 'Failed' },
        { code: '3', name: 'Skipped' },
        { code: '4', name: 'Unexportable' },
        { code: '0', name: 'Pending' }
    ];
    const statusRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '3em' }} value={options.name} optionValue="code" optionLabel="name"  options={globalFlags} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={flagTemplate} placeholder="Select One" className="p-column-filter" showClear  />
        );
    };
    
    const LocationRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '4em' }} value={options.name} optionValue="code" optionLabel="name"  options={LocationFlags} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={flagTemplate} placeholder="Select One" className="p-column-filter" showClear  />
        );
    };

    const exportRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '3em' }} value={options.name} optionValue="code" optionLabel="name"  options={exportFlags} onChange={(e) => options.filterApplyCallback(e.value)} placeholder="Select One" className="p-column-filter" showClear  />
        );
    };
    const flagTemplate = (option) => {
        return <Badge value={option.name} severity={getSeverity(option.name)} />;
    };
    const getSeverity = (flag) => {
        switch (flag) {
            case 'Yes':
                return 'danger';
            case 'No':
                return 'success';
            case 'Assigned':
                return 'success';
            case 'Not Assigned':
                return 'danger';
            case 'Released':
                return 'primary';
            case 'Partially':
                return 'info';
        }
    };
    const toast = useRef();
    const [dates, setDates] = useState(null);
    const [visibleRight, setVisibleRight] = useState(false);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: {
            pick_list_line: { value: '', matchMode: 'contains' },
            order_code: { value: '', matchMode: 'contains' },
            order_type: { value: '', matchMode: 'contains' },
            item_no: { value: '', matchMode: 'contains' },
            item_reference: { value: '', matchMode: 'contains' },
            item_description: { value: '', matchMode: 'contains' },
            qty: { value: '', matchMode: 'contains' },
            uom: { value: '', matchMode: 'contains' },
            bpcord: { value: '', matchMode: 'contains' },
            dlvdat: { value: '', matchMode: 'contains' },
            shidat: { value: '', matchMode: 'contains' },
            site: { value: '', matchMode: 'contains' },
            ship_to: { value: '', matchMode: 'contains' },
            kit_flag: { value: '', matchMode: 'contains' },
            lot_detail: { value: '', matchMode: 'contains' },
            input_sku: { value: '', matchMode: 'contains' },
            input_uom: { value: '', matchMode: 'contains' },
            input_qty: { value: '', matchMode: 'contains' },
            is_valid_item: { value: '', matchMode: 'contains' },
            is_exported: { value: '', matchMode: 'contains' },
            is_location_assigned: { value: null, matchMode: 'contains' },
        }
    });

    const { onSort } = useLazySort(setlazyState);
    const [logs, setLogs] = useState(null);
    const [errorLogs, setErrorLogs] = useState(null);
    const [visible, setVisible] = useState(false);
    const [dialogText, setDialogText] = useState('');

    

    const reactRouterLink = (label, url) => {
        return (<Link to={url}>{label}</Link>);
    }

    const items = [{ label: 'Inbound' }, { template: reactRouterLink('Shipments', '/inbound/shipments') }];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;
    const params = useParams();
    const LocationFlags = [
        { code: '1', name: 'Assigned' },
        { code: '2', name: 'Partially' },
        { code: '0', name: 'Not Assigned' },
        { code: '3', name: 'Released' },
    ];
    const logTopics = useState({
        moduleId: 2,
        subModuleId: [5,12,14],
        subjectId: params.id
    });

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

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


    const loadLazyData = () => {
        OrdersImportService.getOrdersDetail(params.id).then((data) => {
            setPickListDetail(data.data[0]);
            setStatusValue(data.data[0].status);

            if (data.data.lv_status === 'Pending' || data.data[0].invalid_items == false || data.data[0].invalid_items == "1") {
              setrevalidateBtnDisabled(false);
           }
            
        });

        // if (pickListDetail.status === 1) {
        //     setStatusValue('Pending');
        // } else if (pickListDetail.status === 2) {
        //     setStatusValue('Processing');
        // } else {
        //     setStatusValue('Completed');
        // }
        setLoading(true);


        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            OrdersImportService.getOrderLines(params.id, (lazyState)).then((data) => {
                setTotalRecords(data.totalRecords);
                setPickListLines(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
        const filtererrorlogs = [];
        GeneralService.getLogsfororders(logTopics[0]).then((data) => {
            setLogs(data.data);
            if((data.data).length > 0){
                data.data.map((a) => { 
                   if(a.event == 'error') filtererrorlogs.push(a);
                
                });
               setErrorLogs(filtererrorlogs);
            } 
        });
        UserSettingService.getMantisUsers().then((data) => {
            setLoading(false);
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

    };

    const onPage = (event) => {
        setlazyState(event);
        setSelectAll(false);
    };

    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };

    const onSelectionChange = (event) => {
        const value = event.value;

        setSelectedPickListLines(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;
       
        if (selectAll) {
            
            setSelectAll(true);
            setSelectedPickListLines(pickListLines);
            
        } else {
            setSelectAll(false);
            setSelectedPickListLines([]);
        }
    };

    const orderIdBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.order_code}
            </>
        );
    };

    // const orderTypeBodyTemplate = (rowData) => {
    //     return (
    //         <>
    //             {rowData.order_type}
    //         </>
    //     );
    // };

    const pick_list_lineBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.pick_list_line}
            </>
        );
    };

    const itemNoBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.item_no}
            </>
        );
    };

    const itemReferenceBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.item_reference}
            </>
        );
    };

    const itemDescriptionBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.item_description}
            </>
        );
    };

    const qtyBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.qty}
            </>
        );
    };

    const uomBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.uom)}
            </>
        );
    };

    // const bpcordBodyTemplate = (rowData) => {
    //     return (
    //         <>
    //             {rowData.bpcord ?? '-'}
    //         </>
    //     );
    // };

    // const dlvdatBodyTemplate = (rowData) => {
    //     return (
    //         <>
    //             {rowData.dlvdat ?? '-'}
    //         </>
    //     );
    // };


    // const shidatBodyTemplate = (rowData) => {
    //     return (
    //         <>
    //             {rowData.shidat ?? '-'}
    //         </>
    //     );
    // };

    const lot_detailBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.lot_detail ?? '-'}
            </>
        );
    };

    const siteBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.site ?? '-'}
            </>
        );
    };
    const ship_toBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ship_to ?? '-'}
            </>
        );
    };
    // const kit_flagBodyTemplate = (rowData) => {
    //     return (
    //         <>
    //             {rowData.kit_flag ?? '-'}
    //         </>
    //     );
    // };
    const input_skuBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.input_sku ?? '-'}
            </>
        );
    };
    const input_uomBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.input_uom ?? '-'}
            </>
        );
    };
    const input_qtyBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.input_qty ?? '-'}
            </>
        );
    };
    const is_location_assignedBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.is_location_assigned == 2) ? <Badge value="Partially" severity="info "></Badge> : (rowData.is_location_assigned == 1) ? <Badge value="Assigned" severity="success"></Badge> : (rowData.is_location_assigned == 3) ? <Badge value="Released" severity="primary"></Badge> : <Badge value="Not Assigned" severity="danger"></Badge>}
            </>
        );
    };
    const invalid_itemBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.is_valid_item == 0)?<Badge value="Yes" severity="danger">N</Badge>:<Badge value="No" severity="success"></Badge>}
            </>
        );
    };
    // const can_exportBodyTemplate = (rowData) => {
    //     return (
    //         <>
    //             {(rowData.can_export == 0)?<Badge value="No" severity="danger">N</Badge>:<Badge value="Yes" severity="success"></Badge>}
    //         </>
    //     );
    // };
    const is_exportedBodyTemplate = (rowData) => {
        if(rowData.is_exported == 1){
            return (
                <>
                    {<Badge value="Success" severity="success"></Badge>}
                </>
            );
        } else if(rowData.is_exported == 2){
            return (
                <>
                    {<Badge value="Failed" severity="danger"></Badge>}
                </>
            );
        } else if(rowData.is_exported == 3){
            return (
                <>
                    {<Badge value="Skipped" severity="warning"></Badge>}
                </>
            );
        } else if(rowData.is_exported == 4){
            return (
                <>
                    {<Badge value="Unexportable" severity="warning"></Badge>}
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
    // const is_kit_itemBodyTemplate = (rowData) => {
    //     return (
    //         <>
    //             {(rowData.is_kit_item == 1)?<Badge value="Yes" severity="success">N</Badge>:<Badge value="No" severity="danger"></Badge>}
    //         </>
    //     );
    // };
   
   

    // const statusBodyTemplate = (rowData) => {
        
    //     return (
    //         <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />
    //     );
    // };

   
    const actionItems = [
        hasActionAccess(PAGE_KEY, "assign_user_location") &&{
            label: 'Assign User Location',
            icon: 'pi pi-user',
            command: () => {
                
                if(selectedPickListLines != null){
                    getShippingLocations(selectedPickListLines)
                    setSelectedUser(null)
                    setPalletSelectedUser(null);     
                    setbtnDisabled(true) 
                    setAssigntouseruom('cs')
                    onclick(setDisplayConfirmation7(true))
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Select atleast 1 order line' });
                }
            }
        }
        
    ].filter(Boolean);

    const formatDateTimeWithZ = (dt) => {
        if (!dt) return "";

        // If it already contains 'Z', return as is
        if (dt.endsWith("Z")) return dt;

        // Ensure milliseconds are 6 digits
        let [datePart, timePart] = dt.split("T");
        let [hms, ms = "000"] = timePart.split(".");
        
        ms = (ms + "000000").slice(0, 6); // pad to 6 digits

        return `${datePart}T${hms}.${ms}Z`;
    };

    const addMilliseconds = (dt) => {
        if (!dt) return "";
        return dt.includes('.') ? dt : dt + ".000";
    };

    const exportExcel = () => {
        import('xlsx').then((xlsx) => {

            const formattedData = pickListLines.map(item => ({
                ...item,
                delivery_sent: item.delivery_sent ? 1 : 0,
                is_valid_item: item.is_valid_item ? 1 : 0,
                is_kit_item: item.is_kit_item ? 1 : 0,
                picklist_is_deleted: item.picklist_is_deleted ? 1 : 0,
                can_export: item.can_export ? 1 : 0,
                is_ship_item : item.is_ship_item ? 1 : 0,
                dlvdat: item.dlvdat ? item.dlvdat.split("T")[0] : "",
                shidat: item.shidat ? item.shidat.split("T")[0] : "",
                created_at: formatDateTimeWithZ(item.created_at),
                updated_at: formatDateTimeWithZ(item.updated_at),
                create_datetime: addMilliseconds(item.create_datetime)
            }));

            const worksheet = xlsx.utils.json_to_sheet(formattedData);
            const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
                const excelBuffer = xlsx.write(workbook, {
                bookType: 'xlsx',
                type: 'array'
            });

            saveAsExcelFile(excelBuffer, 'orderDetail_' + pickListDetail.pick_list_id);
        });
    };
    const getShippingLocations = (selectedPickListLines) => {
        OrdersImportService.gettaskwiseMantisUsers(selectedPickListLines).then((data) => {
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
    }
    const saveAsExcelFile = (buffer, fileName) => {
        import('file-saver').then((module) => {
            if (module && module.default) {
                let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
                let EXCEL_EXTENSION = '.xlsx';
                const data = new Blob([buffer], {
                    type: EXCEL_TYPE
                });

                module.default.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
            }
        });
    };
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
               
                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                {actionItems.length > 0 && (<Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />)}      
            </span>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                
            <Button type="button" icon="pi pi-file-excel" severity="success" rounded onClick={exportExcel} data-pr-tooltip="XLS" />
            </span>
        </div>
    );

    // const representativeRowFilterTemplate = (options) => {
    //     return (
    //         <Calendar value={dates} onChange={(e) => setDates(e.value)} selectionMode="range" readOnlyInput />

    //     );
    // };

    const confirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => reValidateItems()} className="p-button-text" autoFocus />
        </>
    );

    const reValidateItems = () => {
        setDisplayConfirmation(false)
        setLoading(true);
        OrdersImportService.reValidateItems(params.id ).then((data) => {
            setLoading(false);
            if(data.error == 0){
                loadLazyData();
                // setSelectAll(false);
                // setSelectedDelivery([]);
                // toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else{
                // toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    }

    const readMorePopup = (e, item, event) => {
        e.preventDefault();
        setVisible(true);
        
        let text = '';
    
        // Ensure properties is parsed if it's a string
        let parsedProperties = {};
        try {
            parsedProperties = typeof item === "string" ? JSON.parse(item) : item;
        } catch (error) {
            console.error("Error parsing properties:", error);
            parsedProperties = {}; // Fallback in case of error
        }
    
        // Extract data/request/response if available
        const data = parsedProperties?.data || null;
        const request = parsedProperties?.request || null;
        const response = parsedProperties?.response || null;
    
        if (data) {
            // Display shipment details
            text += '<h5>Below data created</h5>';
            Object.keys(data).forEach((key) => {
                text += `${key} = ${data[key]}<br>`;
            });
        } else if (event === 'sync') {
            // Display sync request and response
            text += '<h5>Request</h5>';
            text += `<meta http-equiv="Content-Type" content="text/html; charset=utf-8">${request || 'No request data'}</meta>`;
            text += '<br><h5>Response</h5>';
            text += JSON.stringify(response || 'No response data', null, 2);
        } else if (event === 'error') {
            // Display error message
            text += '<h5>Exception</h5>';
            text += item?.error || 'No error data';
        }
    
        setDialogText(text);
    };    



    const customizedContent = (item) => {

        let causerName =  item.user_name? item.user_name :'System';
        let date = new Date(item.created_at);
        let month = (date.getMonth() < 10) ? '0'+(date.getMonth()+1) : date.getMonth()+1;
        let day = (date.getDate() < 10) ? '0'+(date.getDate()) : date.getDate();
        let hours = (date.getHours() < 10) ? '0'+(date.getHours()) : date.getHours();
        let minutes = (date.getMinutes() < 10) ? '0'+(date.getMinutes()) : date.getMinutes();
        let seconds = (date.getSeconds() < 10) ? '0'+(date.getSeconds()) : date.getSeconds();
        return (
            <div className='timeline_content'>
                <div className='main_line'>
                    

                </div>
                <div className='secondary_line'>
                    <p style={{fontWeight:'bold'}}>{date.getFullYear()+'-'+month+'-'+day+' '+hours+':'+minutes+':'+seconds} </p>
                    <Button label={item.event.toUpperCase()} className={item.event == 'success' ? 'status_btn  btn_success' : (item.event == 'error') ? 'status_btn  btn_danger' : 'status_btn  btn_info'}></Button>
                </div>
                <div className='secondary_line'>
                    <p>{item.description}</p>
                    <a href='' onClick={(e) => readMorePopup(e, item.properties, item.event)}>read more</a>
                </div>
                <div className='secondary_line mb-3'>
                    <p>By <span style={{fontWeight:'bold'}}>{causerName}</span></p>
                </div>
                
            </div>
        );
    };

   
    const confirmationDialogFooter7 = (
        <div>
            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitUserLoc()} />
        </div>
    );
    const onSubmitUserLoc = () => {
        
        setbtnDisabled(true);
        
        const orderLines = selectedPickListLines.map(line => {
            return {
              id: line.id,
              item_reference: line.item_reference
            };
          })

        const data = {
            orders: orderLines,
            user: selectedUser,
            pallet_user: palletSelectedUser,
            uom: assigntouseruom,
            customer: pickListDetail.customer_code ?? '',
            order_type:pickListDetail.order_type ,
            pick_list_id: pickListDetail.pick_list_id ,
            id: pickListDetail.id ,
            assigned_type: 2,
        }
       
       OrdersImportService.assignUserToOrdersLinesLoc(data).then((data) => {
            setLoading(false);
            setDisplayConfirmation7(false)
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedPickListLines(null)
                loadLazyData();
                
            } 
            else{
                setSelectAll(false);
                setSelectedPickListLines(null)
                setbtnDisabled(false);
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setbtnDisabled(false);
            setDisplayConfirmation7(false)
        });
        
    };
    return (
        <>
        <Toast ref={toast} />
        <OrderMenu/>
        <Button
            label="Back"
            icon="pi pi-arrow-left"
            className="p-button-primary"
            onClick={() => navigate("/outbound/orders-import")} 
            style={{ margin: '10px 0' }}
        />
        <Dialog header="Assign User" visible={displayConfirmation7} style={{ width: '50vw' }} 
        onHide={() => setDisplayConfirmation7(false)} footer={confirmationDialogFooter7}>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-9">
                        <label className='pl-3'>Asign User for Cases *</label>
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
                    <div className="field col-12 md:col-9">
                        <label className='pl-3'>Asign User for Pallet *</label>
                        <Dropdown 
                            style={{marginRight:5, marginLeft:10}} 
                            value={palletSelectedUser}
                            optionValue="emp_ID" 
                            optionLabel="Name" 
                            onChange={(e) => {
                                setPalletSelectedUser(e.value)     
                                setbtnDisabled(false)                           
                            }} 
                            options={usersDropdownlist} 
                            placeholder="Select User"  
                            filter={true}
                        />
                    </div>
                </div>
            </Dialog>
            {/* <BreadCrumb model={items} home={home} /> */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>PickList # {pickListDetail.pick_list_id}</h3>
                <div className='page-headerActions' style={{ display: "flex", gap: 30, alignItems: 'center' }}>
                    <span onClick={() => setVisibleRight(true)} style={{ cursor: 'pointer', fontWeight: 500, fontSize: '18px', lineHeight: '21px', color: '#222222' }}><i className='pi pi-list' style={{ fontWeight: '600', fontSize: '20px' }}></i><span className='p-badge p-component p-badge-no-gutter p-badge-danger'></span>View Logs</span>
                    {/* <span style={{ fontWeight: 500, fontSize: '18px', lineHeight: '21px', color: '#222222' }}><i className='pi m-left' style={{ fontWeight: '500', fontSize: '20px' }}></i> Back</span> */}
                </div>
            </div>
            <h1></h1>

            <Sidebar className='logs_sidebar'  visible={visibleRight} onHide={() => setVisibleRight(false)} baseZIndex={1000} position="right">
                <div className='side_barHeader mt-4'>
                    <div className='left_centent'>Logs</div>
                    {/* <div className='right_centent'><i className='pi m-check-circle mr-1'></i>Mark all as read</div> */}
                </div>
                <div className='mt-6'>
                    <TabView>
                        <TabPanel header="Logs">
                            <Timeline className='logs_timeline' value={logs} content={customizedContent} />
                        </TabPanel>
                        <TabPanel header="Error Logs">
                            <Timeline className='logs_timeline' value={errorLogs} content={customizedContent} />
                            
                        </TabPanel>
                        
                    </TabView>
                    
                    
                </div>
                
            </Sidebar>

            <Dialog header="Log Detail" visible={visible} style={{ width: '50vw' }} onHide={() => setVisible(false)}>
                <p className="m-0" dangerouslySetInnerHTML={{__html: dialogText}}>
                </p>
            </Dialog>

            <Dialog header="Confirmation" visible={displayConfirmation} onHide={() => setDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            
            <div className="card">
                {/* <h3>Shipment</h3> */}
                <h1></h1>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-4">
                        <h5 id="created_at">Created At</h5>
                        <p htmlFor="created_at">
                            {pickListDetail.created_at ? pickListDetail.created_at.split("T")[0] : ""}
                        </p>
                    </div>
                 
                    {/* <div className="field col-12 md:col-4">
                        <h5 id="status">Status</h5>
                        <Tag value={statusValue} severity={getStatusSeverity(pickListDetail.status)} />

                    </div> */}
                </div>
            </div>    
            <div className="card">
                
                <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">             
                    <span className="block mt-2 md:mt-0 p-input-icon-left">
                        <h3>PickList Lines</h3>
                    </span>
                    <span className="block mt-2 md:mt-0 p-input-icon-left">
                        {hasActionAccess(PAGE_KEY,"revalidate_items") &&(<Button label="Re-Validate Items" disabled={revalidateBtnDisabled} icon="pi pi-check" severity="secondary" onClick={() => setDisplayConfirmation(true)} />)}
                    </span>
                </div>
                <h1></h1>
                <DataTable
                    value={pickListLines}
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
                    rowsPerPageOptions={[25, 50, 100, 500]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    loading={loading}
                    header={header}
                    tableStyle={{ minWidth: '75rem' }}
                    emptyMessage="No records found."
                    selection={selectedPickListLines}
                    onSelectionChange={onSelectionChange}
                    selectAll={selectAll}
                    onSelectAllChange={onSelectAllChange}
                    scrollable
                    scrollHeight="600px"
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

                    <Column field="pick_list_line" sortable filter header="Line #" headerStyle={{ width: '12rem' }} body={pick_list_lineBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />

                    <Column field="order_code" header="Order #" body={orderIdBodyTemplate} headerStyle={{ width: '12rem' }} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    {/* <Column field="order_type" sortable header="Order Type" headerStyle={{ width: '12rem' }} body={orderTypeBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" /> */}
                    <Column field="item_no" sortable filter header="Item No" headerStyle={{ width: '12rem' }} body={itemNoBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />

                    <Column field="item_reference" header="Item Ref" headerStyle={{ width: '12rem' }} body={itemReferenceBodyTemplate} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="item_description" header="Item Description" headerStyle={{ width: '12rem' }} body={itemDescriptionBodyTemplate} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="lot_detail" header="Lot Details" headerStyle={{ width: '2rem' }} body={lot_detailBodyTemplate} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="qty" sortable header="Qty" headerStyle={{ width: '12rem' }} body={qtyBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="uom" sortable filter header="UOM" headerStyle={{ width: '12rem' }} body={uomBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                    {/* <Column field="bpcord" header="Bpcord"  headerStyle={{ width: '12rem' }}v body={bpcordBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" /> */}
                    {/* <Column field="dlvdat" header="dlvdat" headerStyle={{ width: '12rem' }} body={dlvdatBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" /> */}
                    {/* <Column field="shidat" header="Shidat" headerStyle={{ width: '12rem' }} body={shidatBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" /> */}
                    <Column field="site" header="Site" headerStyle={{ width: '12rem' }} body={siteBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="ship_to" header="Ship To" headerStyle={{ width: '12rem' }} body={ship_toBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    {/* <Column field="kit_flag" header="Kit Flag" headerStyle={{ width: '12rem' }} body={kit_flagBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" /> */}
                    <Column field="input_sku" sortable header="Input SKU" body={input_skuBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="input_uom" sortable header="Input UOM" body={input_uomBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="input_qty" sortable header="Input Qty" body={input_qtyBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="is_location_assigned"  header="Ship Loc Status" body={is_location_assignedBodyTemplate} filter showFilterMenu={false} filterElement={LocationRowFilterTemplate}  />    
                    <Column field="is_valid_item" header="Invalid Item" body={invalid_itemBodyTemplate} showFilterMenu={false} filter filterElement={statusRowFilterTemplate} filterPlaceholder="Search"/>
                    {/* <Column field="can_export" header="Exportable" body={can_exportBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" /> */}
                    <Column field="is_exported" header="Is Exported" body={is_exportedBodyTemplate}  showFilterMenu={false} filter filterElement={exportRowFilterTemplate} filterPlaceholder="Search" />

                    {/* <Column field="is_kit_item" header="Is Kit" headerStyle={{ width: '12rem' }} body={is_kit_itemBodyTemplate}  /> */}

                    {/* <Column field="status" style={{width:'200px'}} header="Status" body={statusBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" /> */}
                    
                </DataTable>
            </div>
        </>

    );
}
