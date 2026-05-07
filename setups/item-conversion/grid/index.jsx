
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
import * as XLSX from 'xlsx';
import { useLazySort } from '../../../../components/useLazySort';
import { useAuth } from '../../../../store/useAuth';



export default function ItemConversion() {
    const {hasActionAccess} = useAuth();
        const PAGE_KEY = "setups_itemConversion";
        const {hasPageAccess} = useAuth();
        const Detail_PAGE_KEY ="setups_itemConversion_details";
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [conversionItems, setConversionItems] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedConversionItems, setSelectedConversionItems] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);

    const [displayConfirmation1, setDisplayConfirmation1] = useState(false);
    const [btnDisabled, setbtnDisabled] = useState(false);

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
            sku_x3: { value: null, matchMode: 'contains' },
            uom_x3: { value: null, matchMode: 'contains' },
            sku_mantis: { value: null, matchMode: 'contains' },
            uom_mantis: { value: null, matchMode: 'contains' },
            is_kit_item: { value: null, matchMode: 'contains' },
            is_ship_item: { value: null, matchMode: 'contains' },
        }
    });

    const { onSort } = useLazySort(setlazyState);
    
    const [removeItemData, setRemoveItemData] = useState({
        Sku: '',
    })

    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)

    const dispatch = useDispatch()


    const items = [{ label: 'Items' }, { label: 'Item Conversion'}];
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
            ItemConversionService.getItemsGrid( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                 // Add unique key for each row
                const processedData = data.data.map((item, index) => ({
                    ...item,
                    uniqueKey: `${item.sku_mantis}_${index}`
                }));
                setConversionItems(processedData);
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

    const onSelectionChange = (event) => {
        const value = event.value;

        setSelectedConversionItems(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            ItemConversionService.getItemsGrid().then((data) => {
                setSelectAll(true);
                setSelectedConversionItems(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedConversionItems([]);
        }
    };

    // const sku_mantisBodyTemplate = (rowData) => {
    //     return (
    //         <Link to={`${rowData.sku_mantis}`}>{rowData.sku_mantis}</Link>
    //     );
    // };
    
    const sku_mantisBodyTemplate = (rowData) => {
    const hasDetailAccess = hasPageAccess(Detail_PAGE_KEY);

    return hasDetailAccess ? (
        <Link to={`${rowData.sku_mantis}`}>{rowData.sku_mantis}</Link>
    ) : (
        <span>{rowData.sku_mantis}</span>
    );
};

    const uom_mantisBodyTemplate = (rowData) => {
        return (
            <>{rowData.uom_mantis}</>
        );
    };
    const sku_x3BodyTemplate = (rowData) => {
        return (
            <>
                {rowData.sku_x3}
            </>
        );
    };
    const uom_x3BodyTemplate = (rowData) => {
        return (
            <>
                {rowData.uom_x3}
            </>
        );
    };
    const is_kitBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.is_kit_item == 1)?<Badge value="Yes" severity="success">N</Badge>:<Badge value="No" severity="danger"></Badge>}
            </>
        );
    };
    const is_shipBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.is_ship_item == 1)?<Badge value="Yes" severity="success">N</Badge>:<Badge value="No" severity="danger"></Badge>}
            </>
        );
    };

    const actionBodyTemplate = (rowData) => {
        return (<Button type="button" onClick={()=>removeItemsPopup(rowData.id)} icon="pi pi-trash" rounded></Button>);
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                {hasActionAccess(PAGE_KEY, "add_item_conversion") &&(<Button label="Add Item Conversion" icon="pi pi-plus" severity="sucess" onClick={() => navigate("/setup/item-conversion/add")} />)}
            </span>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                {hasActionAccess(PAGE_KEY, "upload") &&(<Button label="Upload" icon="pi pi-upload" severity="secondary" onClick={() => setDisplayConfirmation(true)} />)}
            </span>
        </div>
    );

   const fileUploadHandler = ({files}) => {
        const [file] = files;
        uploadFile(file);
    };

    const uploadFile = async (inputFile) => { 
        fileRef.clear();
        setLoading(true);
        setDisplayConfirmation(false);

        // Show validation errors
        const showValidationError = (message) => {
            toast.current.show({
                severity: 'error',
                summary: 'Validation Error',
                detail: message,
                sticky: true,
            });
            setLoading(false);
            setTimeout(() => toast.current.clear(), 1500);
        };

        // Check if a file is selected
        if (!inputFile) {
            showValidationError('File is required.');
            return;
        }

        // Check for valid MIME types
        const validTypes = [
            'text/csv',
            'application/vnd.ms-excel', // .xls
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
        ];

        if (!validTypes.includes(inputFile.type)) {
            showValidationError('Invalid file type. Please upload a CSV, XLS, or XLSX file.');
            return;
        }

        const reader = new FileReader();

        reader.onload = async (e) => { 
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert sheet to JSON
            let jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
            jsonData = jsonData.filter(row =>
            Object.values(row).some(value =>
            String(value).trim() !== ''
            )
           );
            if (jsonData.length === 0) {
                showValidationError('No data found in the Excel file. Please provide at least one row with data.');
                return;
            }

            // Optional: add default/extra fields if needed
            jsonData = jsonData.map((row) => ({
                ...row,
                sku_x3: String(row.sku_x3 ?? ''),
                sku_mantis: String(row.sku_mantis ?? ''),
                uom_mantis: String(row.uom_mantis ?? ''),
                receiving: String(row.receiving ?? ''),
                shipping: String(row.receiving ?? ''),
                is_kit_item: row.is_kit_item === true || row.is_kit_item === 'TRUE' || row.is_kit_item === 1 || row.is_kit_item === '1',
            }));

            // Validate each row
            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i];
                const rowNumber = i + 2;

                if (!row.sku_x3 || row.sku_x3 === '') {
                    showValidationError(`sku_x3 is missing from row ${rowNumber}`);
                    return;
                }
                if (!row.sku_mantis || row.sku_mantis === '') {
                    showValidationError(`sku_mantis is missing from row ${rowNumber}`);
                    return;
                }
                if (!row.uom_mantis || row.uom_mantis === '') {
                    showValidationError(`uom_mantis is missing from row ${rowNumber}`);
                    return;
                }
            }

            try {
                const response = await ItemConversionService.uploadItems(jsonData); 
                if (response.error === 0) {
                    toast.current.show({
                        severity: 'success',
                        summary: 'File Upload',
                        detail: response.message
                    });

                    setLoading(true);
                    const gridData = await ItemConversionService.getItemsGrid(lazyState);
                    setTotalRecords(gridData.totalRecords);
                    setConversionItems(gridData.data);
                    setLoading(false);
                    setDisplayConfirmation(false);
                } else {
                    toast.current.show({
                        severity: 'error',
                        summary: 'File Upload',
                        detail: response.message,
                        sticky: true
                    });
                    setTimeout(() => toast.current.clear(), 3000);
                }
            } catch (err) {
                toast.current.show({
                    severity: 'error',
                    summary: 'File Upload Error',
                    detail: err.message || 'Network or server error occurred.',
                    sticky: true
                });
                setLoading(false);
                setTimeout(() => toast.current.clear(), 1500);
            }
        };

        reader.readAsBinaryString(inputFile);
    };

    const removeItemsPopup = (id) => {
        setRemoveItemData({
            id
        })
        setDisplayConfirmation1(true)
    }

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
            <title>Item Conversion | Sagis</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
        <Dialog header="Upload" visible={displayConfirmation} onHide={() => setDisplayConfirmation(false)} style={{ width: '550px' }} modal footer={confirmationDialogFooter}>
        <Link to={templateUrl} >Download Template</Link>
        <h1></h1>
            <FileUpload name="file[]"
                    ref={(el) => fileRef = el}
                    customUpload={true}
                    uploadHandler={fileUploadHandler}
                    accept=".xls,.csv,.xlsx" 
                    maxFileSize={1000000} 
                    emptyTemplate={<p className="m-0">Drag and drop file here to upload.</p>} 
                />
        </Dialog>
        <Dialog closable={false} header="Confirmation" visible={displayConfirmation1} onHide={() => setDisplayConfirmation1(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter1}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to remove this item?</span>
                </div>
            </Dialog>
        <h1></h1>
        <div className="card">
            <h3>Item Conversion</h3>
            <DataTable 
                value={conversionItems} 
                lazy 
                filterDisplay="row" 
                dataKey="uniqueKey" 
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
                rowsPerPageOptions={[25, 50, 100, 500, 1000, 5000]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                loading={loading} 
                tableStyle={{ minWidth: '75rem' }}
                emptyMessage="No records found."
                selection={selectedConversionItems} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                header={header}
                scrollable 
                scrollHeight="600px"
                
            >
                <Column field="sku_mantis" sortable header="Mantis Sku" body={sku_mantisBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="uom_mantis" header="Mantis Uom" body={uom_mantisBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                <Column field="sku_x3" sortable header="X3 Sku" body={sku_x3BodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />         
                
                <Column field="uom_x3" sortable header="X3 Uom" body={uom_x3BodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="is_kit_item" header="Is Kit" body={is_kitBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                <Column field="is_ship_item" header="Is Ship" body={is_shipBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                {hasActionAccess(PAGE_KEY, "delete") &&(<Column headerStyle={{ width: '5rem', textAlign: 'center' }} bodyStyle={{ textAlign: 'center', overflow: 'visible' }} header="Action" body={actionBodyTemplate} />)}

            </DataTable>
        </div>
        </>
        
    );
}
        