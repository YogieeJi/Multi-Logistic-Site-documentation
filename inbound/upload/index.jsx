
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useParams } from 'react-router-dom';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import { FileUploadCall } from '../../../service/inbound/FileUpload';
import { BreadCrumb } from 'primereact/breadcrumb';

export default function InboundFileUpload() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);

    const [uploadLines, setuploadLines] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selecteduploads, setSelecteduploads] = useState(null);

    const [change, setChange] = useState(null);


    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: {
            file_name: { value: '', matchMode: 'contains' },
            created_at: { value: '', matchMode: 'contains' },
        }
    });

    let fileRef = useRef();
    const toast = useRef(null);
  
    let networkTimeout = null;
    const params = useParams();
 const items = [{ label: 'Other' }, { label: 'File Upload'}];
    const home = { icon: 'pi pi-home', url: '/' }
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
            FileUploadCall.getFileUploadGrid( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setuploadLines(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);

       

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

        setSelecteduploads(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            FileUploadCall.getFileUploadGrid(params.id).then((data) => {
                setSelectAll(true);
                setSelecteduploads(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelecteduploads([]);
        }
    };

    const fileNameBodyTemplate = (rowData) => {
        return (
            <Link to={`${rowData.path}`}>{rowData.file_name}</Link>
        );
    };

    const createdAtBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.created_at}
            </>
        );
    };

  

    const fileUploadHandler = ({files}) => {
        const [file] = files;
        uploadFile(file);
    };

    const uploadFile = async (inputFile) => {
        let formData = new FormData();
        formData.append('inputFile', inputFile);
        formData.append('topic', 'inbound');
 
        FileUploadCall.uploadFile( formData ).then((data) => {
            if(data.error == 0){
                fileRef.clear();
                toast.current.show({ severity: 'success', summary: 'File Upload', detail: data.message});

                setLoading(true);
                FileUploadCall.getFileUploadGrid( (lazyState) ).then((data) => {
                    setTotalRecords(data.totalRecords);
                    setuploadLines(data.data);
                    setLoading(false);
                });

            } else{
                toast.current.show({ severity: 'error', summary: 'File Upload', detail: data.message, sticky: true});
                networkTimeout = setTimeout(() => {
                   toast.current.clear();
                }, 3000);
            }
           
        });
    };

    return (
        <>
        <BreadCrumb model={items} home={home} />
            <Toast ref={toast} />
            <div className="card mt-4">
                <h3>File Upload</h3>
                <FileUpload name="file[]"
                    ref={(el) => fileRef = el}
                    customUpload={true}
                    uploadHandler={fileUploadHandler}
                    accept=".xls,.csv,.xlsx" 
                    maxFileSize={1000000} 
                    emptyTemplate={<p className="m-0">Drag and drop file here to upload.</p>} 
                />
            </div>
            
            <div className="card">
                <h3>Uploaded Files</h3>
                <h1></h1>
                <DataTable 
                    value={uploadLines} 
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
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    loading={loading} 
                    tableStyle={{ minWidth: '75rem' }}
                    emptyMessage="No data found."
                    selection={selecteduploads} 
                    onSelectionChange={onSelectionChange} 
                    selectAll={selectAll} 
                    onSelectAllChange={onSelectAllChange}
                    scrollable 
                    scrollHeight="600px"
                    removableSort
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
            
                    <Column field="file_name" header="File" body={fileNameBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="created_at" sortable header="Created At" body={createdAtBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                
                </DataTable>
            </div>
        </>
       
    );
}
        