
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { useDispatch, useSelector } from 'react-redux';
import { removeData } from "../../../../store/formMessage.slice"
import { ItemConversionService } from '../../../../service/setups/ItemConversionService';
import { Badge } from 'primereact/badge';
import { Dialog } from 'primereact/dialog';
import { FileUpload } from 'primereact/fileupload';
import { ManageTrucksService } from '../../../../service/setups/ManageTrucksService';
import { Dropdown } from 'primereact/dropdown';
import { set } from 'react-hook-form';
import { setsEqual } from 'chart.js/helpers';
import { useLazySort } from '../../../../components/useLazySort';

export default function ItemConversion() {
    const [showbutton, setShowbutton] = useState(false);
    const [buttonLabel, setButtonLabel] = useState(null);
    const [buttonStatus, setButtonStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loading1, setLoading1] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalRecords1, setTotalRecords1] = useState(0);
    const [selectedTruckID,  setSelectedTruckID] = useState(null);
    const [TruckCode,  setTruckCode] = useState(null);
    const [selectedStatus,  setSelectedStatus] = useState(null);
    const [trucks, setTrucks] = useState(null);

    const [selectAll, setSelectAll] = useState(false);
    const [selectedTrucks, setSelectedTrcuks] = useState(null);
    
    const [btnDisabled, setbtnDisabled] = useState(false);
    const [shipmentDetails, setShipmentDetails] = useState(null);
    const toast = useRef();
    let fileRef = useRef();
    const [templateUrl, setTemplateUrl] = useState(false);
    const navigate = useNavigate();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            trk_code: { value: null, matchMode: 'contains' },
            shp_ID: { value: null, matchMode: 'contains' },
            Status: { value: null, matchMode: 'contains' },
        }
    });
    const [lazyState1, setlazyState1] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            shp_Code: { value: null, matchMode: 'contains' },
        }
    });

    const [removeItemData, setRemoveItemData] = useState({
        Sku: '',
    })

const { onSort } = useLazySort(setlazyState);
const { onSort : onSort1 } = useLazySort(setlazyState1);
const [selectedShipment, setSelectedShipment] = useState(null);
const [isModalVisible, setIsModalVisible] = useState(false);


const handleShipmentClick = (rowData) => {
    setSelectedTruckID(rowData.shp_TruckID); 
    setSelectedStatus(rowData.status);
    setTruckCode(rowData.trk_Code);
    fetchShipmentDetails(rowData.shp_TruckID,rowData.status);
    setSelectedShipment(rowData.status);
    setIsModalVisible(true);  
    
};


const shipmentCountBodyTemplate = (rowData) => {
    return (
        <Button 
            type="button" 
            onClick={() => handleShipmentClick(rowData)} 
            cclassName="w-full p-2 mt-2" >
            {rowData.shipmentCount}
        </Button>
        // {rowData.shipmentCount}
        // <a href="#" onClick={() => handleShipmentClick(rowData)}>
        //     {rowData.shipmentCount}
        // </a>
    );
};
const fetchShipmentDetails = (trk_Code, status) => {
    setLoading1(true);
    ManageTrucksService.getShipment({lazyState1, trk_Code, status })
        .then(data => {

            setShipmentDetails(data.data);
            setTotalRecords1(data.totalRecords)
        })
        .catch(error => {
            console.error("Error fetching shipment details:", error);
            setShipmentDetails(null); 
        })
        .finally(() => {
            setLoading1(false);
        });
};

    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)

    const dispatch = useDispatch()


    const items = [{ label: 'Trucks' }, { label: 'Truck Shipments'}];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;
  
    useEffect(() => {
        if(formMessageDetail != ''){
            toast.current.show({ severity: formMessageSeverity, summary: formMessageSummary, detail: formMessageDetail});
            dispatch(removeData());
        }
        loadLazyData();
    }, [lazyState]);

    useEffect(() => {
        fetchShipmentDetails(selectedTruckID, selectedStatus); 
    }, [lazyState1]);

    const loadLazyData = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }
        networkTimeout = setTimeout(() => {
           setTrucks(null);
            ManageTrucksService.getTruckShipment( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setTrucks(data.data);
                setTemplateUrl(data.template_url)
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
    const onPage1 = (event) => {
        setlazyState1(event);
    };

    const onFilter1 = (event) => {
        event['first'] = 0;
        setlazyState1(event);
    };

    const onSelectionChange = (event) => {
        const value = event.value;
        
        setSelectedTrcuks(value);
        setSelectAll(value.length === totalRecords);
        getCheckInOutButtonLabel(value);
        
    };

    const onSelectionChange1 = (event) => {

        
    };


    const onSelectAllChange = (event) => {
        const selectAll = event.checked;
        
        if (selectAll) {
            ManageTrucksService.getTruckShipment.then((data) => {
                setSelectAll(true);
                setSelectedTrcuks(data.shipments);
   
            });
        } else {
            setSelectAll(false);
            setSelectedTrcuks([]);}
       
    };

    const onSelectAllChange1 = (event) => {

       
    };

    const codeBodyTemplate = (rowData) => {
        return (
            <>{rowData.trk_Code}</>
        );
    };
    const shp_CodeBodyTemplate = (rowData) => {
        return (
            <Link to={`/outbound/shipment/${rowData.shp_TruckID}`}>
            {rowData.shp_Code}
        </Link>
        // <>{rowData.shp_Code}</>
        );
    };

    const plateNumberBodyTemplate = (rowData) => {
        return (
            <>{rowData.shipmentCount}</>
        );
    };
    const statusBodyTemplate = (rowData) => {
        return (
            <>
             <Badge value={rowData.status} severity={getSeverity(rowData.status)} />
               
            </>
        );
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
    const globalFlags = [
        { code: '1', name: 'New' },
        { code: '2', name: 'Checked In' },
        { code: '3', name: 'Checked Out' },
    ];
    const globalRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '13em', width: '13em' }} value={options.value} 
            optionValue="code" optionLabel="name"  options={globalFlags} 
            onChange={(e) => options.filterApplyCallback(e.value)} 
            itemTemplate={flagTemplate} placeholder="Select" className="p-column-filter" showClear  />
        );
    };
    const flagTemplate = (option) => {
        return <Badge value={option.name} severity={getSeverity(option.name)} />;
    };


    const getCheckInOutButtonLabel = (value) => {
        if (value.length >= 1) {
            const selectedStatus = value[0].TruckStatus;
            setShowbutton(true);
            if (selectedStatus == 1) {
                setButtonLabel("Check In");
                setButtonStatus(2);
                // console.log(buttonLabel);
            } else if (selectedStatus == 2) {
                setButtonLabel("Check Out");
                setButtonStatus(3);
            } else {
                setButtonLabel(null);
                setButtonStatus(null);
            }
            // console.log(selectedStatus);
            
        } else {
            setButtonLabel(null);
            setShowbutton(false);
        }
    };

   
    const header = (
        <div ></div>
    );


 
    
    

    const removeItem = () => {
        setbtnDisabled(true);

        ItemConversionService.deleteItem(removeItemData).then((data) => {
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

    const confirmationDialogFooter = (
        <>
            
            <Button type="button" label="Close" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
        </>
    );
    const confirmationDialogFooter1 = (
        <>
            <Button type="button" disabled={btnDisabled} label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation1(false)} className="p-button-text" />
            <Button type="button" disabled={btnDisabled} label="Yes" icon="pi pi-check" onClick={() => removeItem()} className="p-button-text" autoFocus />
        </>
    );



    return (
        <>
        <Helmet>
            <title>Truck Shipments | Sagis</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
        <Dialog 
                header={`Truck Code: ${TruckCode}`} 
                visible={isModalVisible} 
                style={{ width: '40vw' }} 
                modal 
                onHide={() => {  setIsModalVisible(false);
                    setShipmentDetails(null);
                    setTotalRecords1(0) }}
            >
       
                <DataTable 

                value={shipmentDetails} 
                lazy 
                filterDisplay="row" 
                dataKey="shp_ID" 
                paginator
                showGridlines
                first={lazyState1.first} 
                rows={lazyState1.rows} 
                totalRecords={totalRecords1} 
                onPage={onPage1}
                onSort={onSort1} 
                size={'small'}
                sortField={lazyState1.sortField}    
                className="datatable-responsive"
                sortOrder={lazyState1.sortOrder}
                onFilter={onFilter1} 
                filters={lazyState1.filters} 
                rowsPerPageOptions={[25, 50, 100, 500]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                loading={loading1} 
                tableStyle={{minWidth: '30rem' }}
                emptyMessage="No records found."
                selection={selectedTrucks} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                header={header}
                scrollable 
                scrollHeight="600px"
            >

                <Column field="shp_Code"  header="Ship Code"  body={shp_CodeBodyTemplate} sortable filter showFilterMenu={false} filterPlaceholder="Search"  />
                <Column field="Status"   bodyStyle={{ textAlign: 'center' }} header="Status" body={statusBodyTemplate} showFilterMenu={false}  />         
            </DataTable>
            </Dialog>
        <h1></h1>
        <div className="card">
            <h3>Truck Shipments </h3>
            <DataTable 
                value={trucks} 
                lazy 
                filterDisplay="row" 
                dataKey="shp_TruckID" 
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
                selection={selectedTrucks} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                header={header}
                scrollable 
                scrollHeight="600px"
            >

                <Column field="trk_code" sortable header="Truck Code" body={codeBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="shp_ID"   bodyStyle={{ textAlign: 'center' }}  headerStyle={{ width: '12rem' }} header="Shipment Count" body={shipmentCountBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} />
                <Column field="Status"   bodyStyle={{ textAlign: 'center' }}  sortable header="Status" body={statusBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search"  />         
                

            </DataTable>
        </div>
        </>
        
    );
}
        