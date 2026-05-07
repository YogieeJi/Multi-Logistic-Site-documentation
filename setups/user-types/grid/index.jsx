
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { outboundShipmentService } from '../../../../service/outbound/outboundShipmentService';
import { MantisUsersService } from '../../../../service/operations/MantisUsersService';

import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Badge } from 'primereact/badge';
import { Helmet } from 'react-helmet';
import titles from '../../../titles';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { PicklistService } from '../../../../service/outbound/PicklistService';
import { DeliveryService } from '../../../../service/outbound/DeliveryService';
import { Link, useNavigate } from 'react-router-dom';
import { LocationsService } from '../../../../service/misc/LocationsService';
import { OrdersImportService } from '../../../../service/outbound/OrdersImportService';
import { Menu } from 'primereact/menu';
import { MultiSelect } from 'primereact/multiselect';
import { useLazySort } from "../../../../components/useLazySort";
import { useAuth } from '../../../../store/useAuth';


export default function shipment() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const navigate = useNavigate();
    const [delivery, setDelivery] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
   
    const [selectedLanes, setSelectedLanes] = useState(null);    
    const [removeItemData, setRemoveItemData] = useState({
        id: '',
    });
    const globalFlags = [
        { code: '1', name: 'pending' },
        { code: '2', name: 'ready to ship' },
        { code: '3', name: 'preparing' },
    ];
    const flagTemplate = (option) => {
        return <Badge value={option.name} severity={getSeverity(option.name)} />;
    };
    const { hasActionAccess, hasPageAccess } = useAuth();
    const PAGE_KEY = "user_types";
    const Detail_PAGE_KEY = "Manage_RFUsers_path_details";

    const [btnDisabled, setbtnDisabled] = useState(false);
    const menuLeft = useRef(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [dates, setDates] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const [displayConfirmation1, setDisplayConfirmation1] = useState(false);
    const [displayConfirmation6, setDisplayConfirmation6] = useState(false);
    const toast = useRef();
    const [laneslist, setLanesList] = useState(null);
    const [selectedLocations, setSelectedLocations] = useState(null);
    const multiselectFooterTemplate = () => {
        const length = selectedLocations ? selectedLocations.length : 0;

        return (
            <div className="py-2 px-3">
                <b>{length}</b> item{length > 1 ? 's' : ''} selected.
            </div>
        );
    };
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            type: { value: null, matchMode: 'contains' },
            path: { value: null, matchMode: 'contains' },
         
        }
    });
    const { onSort } = useLazySort(setlazyState);
    const items = [{ label: 'Users' }, { label: 'Manage RF Users Path' }];
    const home = { icon: 'pi pi-home', url: '/' }
    const confirmationDialogFooter6 = (
        <div>
            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitLanes()} />
        </div>
    );
    let networkTimeout = null;
    const onSubmitLanes = () => {

        setbtnDisabled(true);
        const data = {
            order: selectedDelivery,
            lanes: selectedLanes,
        }
        outboundShipmentService.assignShipmentOrder( (data) ).then((data) => {
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
    const getSeverity1 = (flag) => {
        switch (flag) {
            case 'pending':
                return 'info';

            case 'ready to ship':
                return 'success';
            case 'preparing':
                 return 'warning';
            default: 
                return 'secondary';
        }
    };

    const getSeverity = (status) => {
        // const infoStatuses = ['1'];      
        // const successStatuses = ['2'];   
        const status1 = status.toLowerCase();
        if (status1.includes('pending')) {
            return 'info';
        } else if (status1.includes('ready to ship')) {
            return 'success';
        } else if (status1.includes('preparing')) {
            return 'warning';} 
        else {
            return 'secondary'; 
        }
    };
    const getStatusLabel = (status) => {
        if (status == 1) {
            return 'Pending';
        } else if (status == 2) {
            return 'Ready to Ship';
        } else {
            return 'Unknown'; 
        }
    };

   

    const globalRowFilterTemplate = (options) => {
        return ( 
            <Dropdown style={{ minWidth: '3em', width: '3em' }} value={options.value} 
            optionValue="code" optionLabel="name"  options={globalFlags} 
            onChange={(e) => {
                options.filterApplyCallback(e.value); // Apply the filter
            }}

            itemTemplate={flagTemplate} placeholder="Select" className="p-column-filter" showClear  />
        );
    };

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
            MantisUsersService.getUserTypes( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setDelivery(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
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

        setSelectedDelivery(value);
        setSelectAll(value.length === totalRecords);
    };
 

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            MantisUsersService.getUserTypes.then((data) => {
                setSelectAll(true);
                setSelectedDelivery(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedDelivery([]);
        }
    };

    const codeBodyTemplate = (rowData) => {
        return (
            <>
                {/* <Link to={`${rowData.shp_ID}`}>{rowData.shp_Code}</Link> */}
                <Link
                to={{
                    pathname: `${rowData.shp_ID}`, // Navigate to the appropriate path using shp_ID
                }}
                state={{ selectedRow: rowData }} // Pass the selected row data in the state
            >
                {rowData.shp_Code}
            </Link>
            </>
        );
    };
    const dltBodyTemplate = (rowData) => {
        return (<Button type="button" onClick={()=>removeItemsPopup(rowData.id)} icon="pi pi-trash" rounded></Button>);
    
    };

    const removeItemsPopup = (id) => {
        setRemoveItemData({
            id
        })
        setDisplayConfirmation1(true)
    }

    const removeItem = () => {
        setbtnDisabled(true);
        setLoading(true);
        const userId = removeItemData.id;
        //console.log(userId);
        MantisUsersService.deleteUserTypes(userId).then((data) => {
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
        });

    }

    const createdAtBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.created_at}
            </>
        );
    };
    const pathBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.path}
            </>
        );
    };
    const statusBodyTemplate = (rowData) => {
        
        return (
            <>
            <Badge value={rowData.MessageName} severity={getSeverity(rowData.MessageName)} />
            </>
        );
    };

    // const typeBodyTemplate = (rowData) => {
    //     return (
    //         // <>
    //         //     {rowData.type}
    //         // </>
    //            <>
    //            {/* <Link to={`${rowData.shp_ID}`}>{rowData.shp_Code}</Link> */}
    //            <Link
    //            to={{
    //                pathname: `/setup/user-types/edit/${rowData.id}`, // Navigate to the appropriate path using shp_ID
    //            }}
    //            state={{ selectedRow: rowData }} // Pass the selected row data in the state
    //        >
    //            {rowData.type}
    //        </Link>
    //        </>
    //     );
    // };

    const typeBodyTemplate = (rowData) => {
    const hasAccess = hasPageAccess(Detail_PAGE_KEY);

    return (
        <>
            {hasAccess ? (
                <Link
                    to={{
                        pathname: `/setup/user-types/edit/${rowData.id}`,
                    }}
                    state={{ selectedRow: rowData }}
                >
                    {rowData.type}
                </Link>
            ) : (
                <span>
                    {rowData.type}
                </span>
            )}
        </>
    );
};

    const dispatch_methodBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.DispatchMethodCodeName}
            </>
        );
    };

    const location_idBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.loc_Code}
            </>
        );
    };

    const syncDetails = () => {
        setDisplayConfirmation(false)
        setLoading(true);
        DeliveryService.syncData().then((data) => {
            setLoading(false);
            if(data.error == 0){
                loadLazyData();
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else{
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    };

    const confirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => syncDetails()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter1 = (
        <>
            <Button type="button" disabled={btnDisabled} label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation1(false)} className="p-button-text" />
            <Button type="button" disabled={btnDisabled} label="Yes" icon="pi pi-check" onClick={() => removeItem()} className="p-button-text" autoFocus />
        </>
    );
   
    const actionItems = [
        {
            label: 'Assign To Lanes',
            icon: 'pi pi-plus',
            command: () => {
                if(selectedDelivery != null && selectedDelivery.length > 0){
                    getLanes()

                    //setNoOfPallets(0)
                    //getAllOrderPalletsCount()

                    setSelectedLanes(null)  
                    
                    setbtnDisabled(true) 
                    onclick(setDisplayConfirmation6(true))
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        }
    ];
    
    const getLanes = () => {
        LocationsService.getLanes().then((data) => {
            if(data.error == 0){
                setLanesList(data.data);
                setSelectedLanes(data.selectedLanes)
            }
        });
    }
    
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            
            {/* <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                <Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />
            </span> */}
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                {hasActionAccess(PAGE_KEY,"add_user_type") &&(<Button label="Add User Type" icon="pi pi-sync" severity="sucess" onClick={() =>navigate("/setup/user-types/add")} />)}
            </span>
        </div>
    );

    const representativeRowFilterTemplate = (options) => {
        return (
            <Calendar value={dates} onChange={(e) => setDates(e.value)} selectionMode="range" readOnlyInput />

        );
    };

    const userTypeDropDownEditor = (rowData) => {
       
        return (
            <select className="select-box-min" onChange={(event) => {
                const newValue = event.target.value;
                rowData.rowData.usr_RFFolder = newValue;
                const textEditorInput = document.getElementById(rowData.rowIndex);
                if (textEditorInput) {
                    textEditorInput.value = newValue;
                }
            }}>
                <option value="">Select </option>    
                {userTypes.map(option => (
                    <option key={option.value} value={option.value} selected={(option.value == rowData?.value) ? 'selected': ''} >
                        {option.label}
                    </option>
                ))}
            </select>
        );
    };

    const userTypeBodyTemplate = (rowData) => {
        return (
            <>
                {getLabelByValue(rowData.usr_RFFolder)}
            </>
        );
    };

    const textEditor = (options) => {
        return <InputText type="text" id={options.rowIndex} style={{ width: '90%' }} value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;
    };

    return (
        <>
        <Helmet>
            <title>{titles.UsersType}</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
        <Dialog header="Confirmation" visible={displayConfirmation} onHide={() => setDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
        </Dialog>
        <Dialog header="Assign Lanes" visible={displayConfirmation6} style={{ width: '50vw' }} onHide={() => setDisplayConfirmation6(false)} footer={confirmationDialogFooter6}>
            <div className="p-fluid formgrid grid">
                <div className="field col-12 md:col-9">
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
                        
                    />
                </div>
            </div>
        </Dialog>
        <Dialog closable={false} header="Confirmation" visible={displayConfirmation1} onHide={() => setDisplayConfirmation1(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter1}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to remove this User type?</span>
                </div>
            </Dialog>
        <h1></h1>
        <div className="card">
            <h3>User Types</h3>
            <DataTable 
                value={delivery} 
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
                emptyMessage="No record found."
                selection={selectedDelivery} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                header={header}
                scrollable 
                scrollHeight="600px"
            >
                <Column field="type" sortable header="User Type" body={typeBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search"    />
                <Column field="path" sortable header="RFPath" body={pathBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search"    />
                {hasActionAccess(PAGE_KEY,"delete_user_type") &&(<Column field="dlt" header="Action" body={dltBodyTemplate} showFilterMenu={false}  />)}
            </DataTable>
        </div>
        </>
        
    );
}
        