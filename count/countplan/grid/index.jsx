
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ShipmentsService } from '../../../../service/inbound/ShipmentService';
import { Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Badge } from 'primereact/badge';
import { Helmet } from 'react-helmet';
import titles from '../../../titles';
import { CountService } from '../../../../service/Count/CountService';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Menu } from 'primereact/menu';
import { Dropdown } from 'primereact/dropdown';
import '../../../../assets/styles.css';
import { ManualContainersService } from '../../../../service/inbound/ManualContainerService';
export default function Shipments() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [shipments, setShipments] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedShipments, setSelectedShipments] = useState(null);
    const [dates, setDates] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const [displayConfirmation1, setDisplayConfirmation1] = useState(false);
    const menuLeft = useRef(null);
    const [btnDisabled, setbtnDisabled] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [prevCursor, setPrevCursor] = useState(null);
    const [ExcludeDisplayConfirmation, setExcludeDisplayConfirmation] = useState(false);
    const [markCountCompleteDisplayConfirmation, setMarkCountCompleteDisplayConfirmation] = useState(false);
    let data = {};
    const toast = useRef();
    
    const globalFlags = [
        { code: '1', name: 'Yes' },
        { code: '0', name: 'No' },
    ];
    const rowsOptions = [10, 25, 50, 100]; 
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
           
            
        }
    });
    const globalRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '3em' }} value={options.name} 
            optionValue="code" optionLabel="name"  options={globalFlags} 
            onChange={(e) => options.filterApplyCallback(e.value)} 
            itemTemplate={flagTemplate} placeholder="Select" className="p-column-filter" showClear  />
        );
    };

    
    const excludeSecond = () => {
        data = {
            countID: selectedShipments[0].cpn_ID,
            maxCount: selectedShipments[0].cpn_CountNumber
        }

        setbtnDisabled(true);
        setLoading(true);
        CountService.updateCountLocationToMax( data ).then((data) => {
            setLoading(false);
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                setSelectAll(false);
                setSelectedShipments([]);
                
                loadLazyData();
            } 
            else{
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
            }
            setbtnDisabled(false);
            setExcludeDisplayConfirmation(false)
            
        });    
        
            
    };
    const items = [{ label: 'Count' }, { label: 'Count Plan'}];
    const home = { icon: 'pi pi-home', url: '/' }
    const flagTemplate = (option) => {
        return <Badge value={option.name} severity={getSeverity(option.name)} />;
    };
    let networkTimeout = null;

   
  useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const actionItems = [
        {
            label: 'Complete Count',
           icon: 'pi pi-check',
            command: () => {
                if(selectedShipments != null && selectedShipments.length > 0){
                    setMarkCountCompleteDisplayConfirmation(true)
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 Count' });
                }
            }
        },
        {
            label: 'Counted Locations With Matched Stock',
            icon: 'fa fa-plus',
            command: () => {
                if(selectedShipments != null && selectedShipments.length == 1){
                    setExcludeDisplayConfirmation(true)
                }
                else if(selectedShipments != null && selectedShipments.length > 1){
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'You cannot select multiple Count at a time.' });
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select atleast Count' });
                }
            }    
        },
        
    ];
   


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
            CountService.getCountPlans( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setShipments(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
    };
    const handleNext = (event) => {
        setlazyState(prevState => ({
            ...prevState,    
            cursor: nextCursor 
        }));
        
        
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

        setSelectedShipments(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
                setSelectAll(true);
                setSelectedShipments(shipments);
        } else {
            setSelectAll(false);
            setSelectedShipments([]);
        }
    };

    const shipmentNumberBodyTemplate = (rowData) => {
        return (
            <>
                <span className="p-column-title">Shipment #</span>
                <Link to={`${rowData.cpn_ID}/${rowData.cpn_code}`}>{rowData.cpn_code}</Link>
            </>
        );
    };

    const completeCount = () => {

           data = {
                    countID: selectedShipments.map((item) => item.cpn_ID),
                    maxCount: selectedShipments.map((item) => item.cpn_CountNumber),
                }

                setbtnDisabled(true);
                setLoading(true);
                CountService.updateCountPlanStatus( data ).then((data) => {
                    setLoading(false);
                    if(data.error == 0){
                        toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                        setSelectAll(false);
                        setSelectedShipments([]);
                        // getItems(zoneDetail.zon_Description);
                        loadLazyData();
                    } 
                    else{
                        toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
                    }
                    setbtnDisabled(false);
                    setMarkCountCompleteDisplayConfirmation(false)
                });
    }

    const getSeverity = (status) => {
        // const infoStatuses = ['1'];      
        // const successStatuses = ['2'];   
        const status1 = status.toLowerCase();
        if (status1.includes('pending')) {
            return 'info';
        } else if (status1.includes('executing')) {
            return 'warning';
        } else if (status1.includes('preparing')) {
            return 'warning';} 
         else if (status1.includes('complete')) {
            return 'success';} 
        else {
            return 'secondary'; 
        }
    };

 const statusBodyTemplate = (rowData) => {
        
        return (
            <>
            <Badge value={rowData.ProgressStatusDescription} severity={getSeverity(rowData.ProgressStatusDescription)} />
            </>
        );
    };
   

    const confirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setMarkCountCompleteDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => completeCount()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter1 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setMarkCountCompleteDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => excludeSecond()} className="p-button-text" autoFocus />
        </>
    );


    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                {/* <SplitButton label="Create Delivery" icon="pi pi-plus" onClick={() => setDisplayConfirmation3(true)} model={actionItems} /> */}
                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                <Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />

            </span>
        </div>
    );

    return (
        <>
        <Helmet>
            <title>{titles.count}</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
        <Dialog header="Confirmation" visible={markCountCompleteDisplayConfirmation} onHide={() => setMarkCountCompleteDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
        </Dialog>
        <Dialog header="Confirmation" visible={ExcludeDisplayConfirmation} onHide={() => setExcludeDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter1}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
        </Dialog>

        <h1></h1>
        <div className="card">
            <h3>Count Plan</h3>
            <DataTable 
                value={shipments} 
                lazy 
                filterDisplay="row" 
                dataKey="cpn_ID" 
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
                emptyMessage="No shipments found."
                selection={selectedShipments} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
               header={header}
                scrollable 
                scrollHeight="600px"
                removableSort
            >
             
                  <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                <Column field="cpn_code" header="Code" body={shipmentNumberBodyTemplate}  />
                <Column field="cpn_Description" header="Description" body={(rowData) => rowData.cpn_Description}  />
                <Column field="cpn_CreateDate"   header="Created At" body={(rowData) => rowData.cpn_CreateDate}  />
                <Column field="CountTypeDescription" header="Type" body={(rowData) => rowData.CountTypeDescription}  />
                <Column field="CountLockTypeDescription" header="Location Locking" body={(rowData) => rowData.CountLockTypeDescription}  />
                <Column field="cpn_CountNumber"  header="Number of Count" body={(rowData) => rowData.cpn_CountNumber} />
                <Column field="status"  header="Status" body={statusBodyTemplate} />
               
                
            </DataTable>
            
        </div>
        </>
        
    );
}
        