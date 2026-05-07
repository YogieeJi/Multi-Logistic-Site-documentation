import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { DashboardService } from '../../service/DashboardService';
import { Helmet } from 'react-helmet';
import titles from '../titles';
import { Dropdown } from 'primereact/dropdown';
import '../../assets/styles.css';
import { ScrollPanel } from 'primereact/scrollpanel';
import ChartComponent from '../../components/ChartComponent';
import { InputText } from 'primereact/inputtext';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'primereact/menu';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Controller, useForm } from 'react-hook-form';
import { classNames } from 'primereact/utils';
import DashboardMenu from './DashboardMenu';
import { ToggleButton } from 'primereact/togglebutton';
import { useSelector } from 'react-redux';
import { useAuth } from '../../store/useAuth';




const onRowEditComplete = (e) => {
    let _products = [...products];
    let { newData, index } = e;

    _products[index] = newData;

    setProducts(_products);
};

const textEditor = (options) => {
    return <InputText type="text" style={{ width: '90%' }} value={options.value} onChange={(e) => options.editorCallback(e.target.value)} />;
};

const Dashboard = (props) => {
    const { hasActionAccess } = useAuth();
    const PAGE_KEY = "conveyor_dashboard";

    const [displayConfirmation1, setDisplayConfirmation1] = useState(false);
    const [displayConfirmationReset, setDisplayConfirmationReset] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const [usersLane, setUsersLane] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const [displayDeleteConfirmation, setDisplayDeleteConfirmation] = useState(false);
    const [lineOptions, setLineOptions] = useState(null)
    const [removeOldPlan, setRmoveOldPlan] = useState("false");
    const [editableSlotID, setEditableSlotID] = useState(0);
    const [editableUpc, setEditableUpc] = useState(0);
    const [selectedPlan, setSelectedPlan] = React.useState(null);
    const [Delete, setdelete] = React.useState(null);
    const [Reset, setReset] = React.useState(null);
    const [Bulk, setBulk] = React.useState(null);
    const [checked, setChecked] = useState(false);
    const navigate = useNavigate();
    const menuLeft = useRef(null);
    const [btnDisabled, setbtnDisabled] = useState(false);
    const [removeItemData, setRemoveItemData] = useState({
        id: '',
    });
    const [loading, setLoading] = useState(false);
    const [loading1, setLoading1] = useState(false);
    const [userLaneLoading, setUserLaneLoading] = useState(false);
    const [receivingPlanData, setReceivingPlanData] = useState([]);
    const [selectedSlotName, setSelectedSlotName] = useState('');
    const [selectedUpcName, setSelectedUpcName] = useState('');
    const [removeAbleData, setRemoveAbleData] = useState(null);
    const [receivingModel, setReceivingModel] = useState(false);
    const [newItemModel, setNewItemModel] = useState(false);
    const [allSlots, setAllSlots] = useState([]);
    const [allItems, setAllItems] = useState([]);
    const [slotmsg, setSlotmsg] = useState('');
    const [upcmsg, setUpcmsg] = useState('');
    const [receivingMsg, setReceivingMsg] = useState('');
    const [laneStatusChart, setLaneStatusChart] = useState([]);
    const [errorLaneStatus, setErrorLaneStatus] = useState([]);
    const [containerMark, setContainerMark] = useState('');
    const toast = useRef();

    const [heading, setHeading] = useState('Add Planned Item');

    let defaultValues = {
        slot: '',
        upc: '',
        qty: '',
        iter: ''
    };

    const form = useForm({ defaultValues });
    const errors = form.formState.errors;

    const onReceivingRowEditComplete = (e) => {
        setLoading(true);
        let _receivingPlanData = [...receivingPlanData];
        let { newData, index } = e;

        const id = e.data.id;

        const data = {
            slot_id: (editableSlotID != 0) ? editableSlotID : newData.slot_id,
            upc: newData.upc,
            qty: newData.qty_pallet_to_cases,
            lot_Number: newData.lot_Number,
            Iteration: newData.total_iteration
        };

        newData.title = (selectedSlotName != '') ? selectedSlotName : newData.title;
        newData.slot_id = (editableSlotID != 0) ? editableSlotID : newData.slot_id;

        DashboardService.updateReceivingPlan(id, data).then((data) => {


            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Data Updated.', detail: data.message });


                _receivingPlanData[index] = newData;

                setReceivingPlanData(_receivingPlanData);
                setEditableSlotID(0);
                setSelectedSlotName('');
                setLoading(false);


            } else {
                setLoading(false);
                toast.current.show({ severity: 'error', summary: 'Error while update.', detail: data.message });
            }
        });

    };
    const applyLightTheme = () => {
        const lineOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: '#495057'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#495057'
                    },
                    grid: {
                        color: '#ebedef',
                    }
                },
                y: {
                    ticks: {
                        color: '#495057'
                    },
                    grid: {
                        color: '#ebedef',
                    }
                },
            }
        };

        setLineOptions(lineOptions)
    }

    const applyDarkTheme = () => {
        const lineOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: '#ebedef'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#ebedef'
                    },
                    grid: {
                        color: 'rgba(160, 167, 181, .3)',
                    }
                },
                y: {
                    ticks: {
                        color: '#ebedef'
                    },
                    grid: {
                        color: 'rgba(160, 167, 181, .3)',
                    }
                },
            }
        };

        setLineOptions(lineOptions)
    }
    const colorsMap = {
        'Black': '#000000',
        'Red': '#ff0000',
        'Green': '#00ff00',
        'Orange': '#ffa500',
        'Blue': '#0000ff',
        'Purple': '#800080',
        'Cyan': '#00ffff',
    };
    useEffect(() => {

        DashboardService.getPendingReceipt().then(data => setReceipt(data?.data));
        // DashboardService.getLaneStatus().then(data => { console.log(data); setLaneStatusChart(data?.laneData); setErrorLaneStatus(data?.ErrorLane) } );
        DashboardService.getLaneStatus().then(data => { console.log(data); setLaneStatusChart(data?.laneData); setErrorLaneStatus(data?.errorLane) });

        DashboardService.getAllSlots().then(data => {
            setAllSlots(data?.data);
        });
        setUserLaneLoading(true);
        DashboardService.getUserLane()
            .then(data => setUsersLane(data?.data))
            .finally(() => setUserLaneLoading(false));
    }, []);

    const Refresh = () => {
        DashboardService.getLaneStatus().then(data => { setLaneStatusChart(data?.laneData); setErrorLaneStatus(data?.errorLane) });

        DashboardService.getAllSlots().then(data => {
            setAllSlots(data?.data);
        });
        setUserLaneLoading(true);
        DashboardService.getUserLane()
            .then(data => setUsersLane(data?.data))
            .finally(() => setUserLaneLoading(false));
        getReceivingPlans(selectedPlan);
    }
    const resetPage = () => {

        DashboardService.getPendingReceipt().then(data => setReceipt(data?.data));
        // DashboardService.getLaneStatus().then(data => { console.log(data); setLaneStatusChart(data?.laneData); setErrorLaneStatus(data?.ErrorLane) } );
        DashboardService.getLaneStatus().then(data => { console.log(data); setLaneStatusChart(data?.laneData); setErrorLaneStatus(data?.errorLane) });


        DashboardService.getAllSlots().then(data => {
            setAllSlots(data?.data);
        });
        setUserLaneLoading(true);
        DashboardService.getUserLane()
            .then(data => setUsersLane(data?.data))
            .finally(() => setUserLaneLoading(false));
    }

    const slotsDropDownEditor = (rowData) => {

        return (
            <select className="select-box" onChange={(event) => {
                setEditableSlotID(event.target.value);
                const index = event.target.selectedIndex;
                setSelectedSlotName(event.target.options[index].text);
            }}>
                <option value="">Select Slot</option>
                {allSlots && allSlots.length > 0 ? (allSlots.map(option => (
                    <option key={option.title} value={option.id} selected={(option.id == rowData?.rowData?.slot_id) ? 'selected' : ''} >
                        {option.title}
                    </option>
                ))
                ) : (
                    <option value="" disabled>No slot Available</option>
                )}
            </select>
        );
    };
    const itemsDropDownEditor = (rowData) => {

        return (
            <select className="select-box" onChange={(event) => {
                setEditableUpc(event.target.value);
                const index = event.target.selectedIndex;
                setSelectedUpcName(event.target.options[index].text)

            }}>
                <option value="">Select Item Code</option>
                {allItems && allItems.length > 0 ? (
                    allItems.map(option => (
                        <option
                            key={option.upc}
                            value={option.upc}
                            selected={(option.upc === rowData?.rowData?.upc) ? 'selected' : ''}
                        >
                            {option.primaryCode}
                            {/* <br/>{option.UPC} */}

                        </option>
                    ))
                ) : (
                    <option value="" disabled>No Items Available</option>
                )}
            </select>
        );
    };

    useEffect(() => {
        if (props.colorMode === 'light') {
            applyLightTheme();
        } else {
            applyDarkTheme();
        }
    }, [props.colorMode]);
    const getAllItemsFun = (id = 'null') => {
        setAllItems(null)
        DashboardService.getAllItems((id)).then(data => {
            setAllItems(data?.data);
        });
    }

    const getReceivingPlans = (value) => {
        setSelectedPlan(value);
        setLoading1(false);

        // console.log(receiptid);
        const id = value.rct_ID;
        if (!id) {
            toast.current.show({ severity: 'error', summary: 'Required Input', detail: 'Please select a receipt' });
            return false;
        }
        setLoading(true);

        getAllItemsFun(id)
        DashboardService.getReceivingPlan((id)).then((data) => {
            if (data.error == 0) {
                console.log(data.is_arrived);
                if (data.is_arrived === true) {
                    setContainerMark('completed');
                } else {
                    setContainerMark('');
                }
                if (data.is_bulk === true) {
                    setChecked(true);
                } else {
                    setChecked(false);
                }
                setdelete(true);
                setReset(true);
                setBulk(true)

                setReceivingPlanData(data.data);

                setLoading(false);

            } else {
                setChecked(false);
                setdelete(false);
                setReset(false);
                setBulk(false)
                setReceivingPlanData([]);
                setLoading(false);
                //toast.current.show({ severity: 'error', summary: 'Error while Data fetching', detail: data.message});
            }
        });


    }
    const reGeneratePlan = () => {

        setDisplayConfirmation(false);
        generatePlan();
    };
    const generatePlan = () => {
        // setContainerMark('');
        // console.log(containerMark);
        if (!selectedPlan) {
            toast.current.show({ severity: 'error', summary: 'Required Input', detail: 'Please select a receipt' });
            return false;
        }
        setLoading(true);
        const data = {
            removeoldplan: removeOldPlan
        };
        const id = selectedPlan.rct_ID;
        DashboardService.generateReceivingPlan(id, data).then((data) => {

            if (data.error == 0) {
                setLoading(false);
                // check if status code is 409 then show popup

                if (data.code == 409) {
                    setRmoveOldPlan("true");
                    setDisplayConfirmation(true);

                } else {
                    setRmoveOldPlan("false");
                }

                getReceivingPlans(selectedPlan);



            } else {
                setReceivingPlanData([]);
                setLoading(false);
                toast.current.show({ severity: 'error', summary: 'Error while Data fetching', detail: data.message });
            }
        });


    }
    const userBodyTemplate = (rowData) => {

        const splitArray = rowData.usr_Logins?.split('|');

        const namesAndColorsArray = splitArray?.map((item, index) => {
            const [name, color] = item.split(',');
            let concatedName = (splitArray.length - 1 === index) ? name : name + " | ";
            return (

                <span style={{ color: colorsMap[color] }}>{concatedName}</span>
            )
        });


        return (
            <div className='pl-4'>
                {namesAndColorsArray}
            </div>
        );
    };
    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-trash" size="small" rounded severity="danger" aria-label="Delete" onClick={() => confirmationBox(rowData)} />
            </>
        );
    };
    const itemCodeBodyTemplate = (rowData) => {
        return (
            <>
                <span>{rowData.itemCode}</span> <br></br>
                <small>{rowData.upc}</small>
            </>
        );
    };
    const confirmationBox = (rowData) => {

        setRemoveAbleData(rowData);

        setDisplayDeleteConfirmation(true);
    }
    const confirmationDeleteDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayDeleteConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => removePlan()} className="p-button-text" autoFocus />
        </>
    );
    const removePlan = () => {

        const id = removeAbleData.id;

        setLoading(true);

        DashboardService.deleteReceivingPlan((id)).then((data) => {

            if (data.error == 0) {
                setDisplayDeleteConfirmation(false);
                setLoading(false);
                setRemoveAbleData(null);
                getReceivingPlans(selectedPlan);



            } else {
                setRemoveAbleData(null);
                setLoading(false);
                toast.current.show({ severity: 'error', summary: 'Error while Deletion', detail: data.message });
            }
        });


    };
    const actionItems = [
        {
            label: 'Color Mapping',
            icon: 'pi pi-palette',
            command: () => {
                navigate("/setup/color-mapping")

            }
        },
        {
            label: 'Manage Lane Users',
            icon: 'pi pi-users',
            command: () => {
                navigate("/setup/lanes")

            }
        },
        {
            label: 'Bulk Receipt',
            icon: 'fa-solid fa-file-invoice',
            command: () => {
                navigate("/operations/receipt-to-lane")

            }
        },
        {
            label: 'Bulk Receipt For Multiple Item',
            icon: 'fa-solid fa-file-invoice',
            command: () => {
                navigate("/operations/multiple-receipt-to-lane")

            }
        },

    ];
    const confirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => reGeneratePlan()} className="p-button-text" autoFocus />
        </>
    );
    const cancleModel = (reload = false) => {

        setReceivingModel(false)

        form.reset();
        setEditableSlotID(0);
        setSelectedSlotName('');
        setEditableUpc(0);
        setSelectedUpcName('');
        setSlotmsg(''); setReceivingMsg(''); setUpcmsg('');
        if (reload == true) { getReceivingPlans(selectedPlan) }
    }
    const onSubmit = (data) => {
        setLoading1(true);
        if (selectedPlan == null) {
            setReceivingMsg("Select receipt ID first.");
            return false;
        } else {
            setReceivingMsg('')
        }
        if (editableSlotID == 0) {
            setSlotmsg("Slot is required.");
            return false;
        } else {
            setSlotmsg('')
        }
        if (editableUpc == 0) {
            setUpcmsg("UPC is required.");
            return false;
        } else {
            setUpcmsg('');
        }
        const req = {
            title: selectedUpcName,
            upc: editableUpc,
            slot_id: editableSlotID,
            qty: data.qty,
            iteration: data.iter,
            ReceiptID: selectedPlan.rct_ID,
            lot_number: data.lot_Number
        }

        DashboardService.createReceivingItem(req).then((data) => {


            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Receiving Item created.', detail: data.message });


                cancleModel(true);

            } else if (data.error == 1) {
                setLoading1(false);
                toast.current.show({ severity: 'error', summary: 'Receiving Item created.', detail: data.message });

            }
            else {
                setLoading1(false);
                setFormMsg(data.message)
                toast.current.show({ severity: 'error', summary: 'Error while creating.', detail: data.message });
            }
        });

    }
    const getFormErrorMessage = (name) => {
        return errors[name] ? <small className="p-error">{errors[name].message}</small> : null;
    };
    const markContainer = () => {
        const rct_ID = selectedPlan.rct_ID

        const data = {
            id: rct_ID,
            action: (containerMark == '') ? "arrived" : "completed"
        };

        DashboardService.markContainer(data).then((data) => {


            // console.log(data)
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Marked successfully.', detail: data.message });
                { setContainerMark('completed'); }
                // setSelectedPlan(null)
                // setReceivingPlanData([]);
            } else {
                setLoading(false);


                toast.current.show({ severity: 'error', summary: 'Error Occur.', detail: data.message });
            }
        });
    }
    const dltBodyTemplate = (rowData) => {
        return (<Button type="button" onClick={() => removeItemsPopup(rowData.id)} icon="pi pi-trash" rounded></Button>);

    };
    const removeItemsPopup = () => {
        if (!selectedPlan) {
            toast.current.show({ severity: 'error', summary: 'Required Input', detail: 'Please select a receipt' });
            return false;
        }
        const id = selectedPlan.rct_ID;
        setDisplayConfirmation1(true)
    }
    const resetreceipt = () => {
        if (!selectedPlan) {
            toast.current.show({ severity: 'error', summary: 'Required Input', detail: 'Please select a receipt' });
            return false;
        }
        const id = selectedPlan.rct_ID;
        setDisplayConfirmationReset(true)
    }
    const resetreceiptplan = () => {
        setbtnDisabled(true);
        setLoading(true);

        const id = selectedPlan.rct_ID;
        const data = {
            id: selectedPlan.rct_ID
        };
        // console.log(id);
        DashboardService.ResetReceipt(data).then((data) => {
            setLoading(false);
            // console.log(data)
            if (data.error == 0) {

                toast.current.show({ severity: 'success', summary: 'Marked successfully.', detail: data.message });
                { setContainerMark('completed'); }
                setSelectedPlan(null)
                setReceivingPlanData([]);
                setBulk(false);
                setdelete(false);
                setReset(false);
                resetPage();
            } else {
                setLoading(false);
                toast.current.show({ severity: 'error', summary: 'Error Occur.', detail: data.message });
            }
            setDisplayConfirmationReset(false)
            setbtnDisabled(false);
        });
    }
    const removeItem = () => {
        setbtnDisabled(true);
        setLoading(true);
        const id = selectedPlan.rct_ID;
        // console.log(id);
        DashboardService.deleteReceipt(id).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
            // loadGrid({});
            setDisplayConfirmation1(false)
            setbtnDisabled(false);
            getReceivingPlans(selectedPlan);
        });

    }

    const confirmationDialogFooter1 = (
        <>
            <Button type="button" disabled={btnDisabled} label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation1(false)} className="p-button-text" />
            <Button type="button" disabled={btnDisabled} label="Yes" icon="pi pi-check" onClick={() => removeItem()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooterReset = (
        <>
            <Button type="button" disabled={btnDisabled} label="No" icon="pi pi-times" onClick={() => setDisplayConfirmationReset(false)} className="p-button-text" />
            <Button type="button" disabled={btnDisabled} label="Yes" icon="pi pi-check" onClick={() => resetreceiptplan()} className="p-button-text" autoFocus />
        </>
    );

    const getDropdownStyle = () => {
        if (selectedPlan?.rct_ProgressID === 2) {
            return { backgroundColor: '#FFF9BF', color: 'black' };
        } else if (selectedPlan?.rct_ProgressID === 1) {
            return { backgroundColor: '#B6FFA1', color: 'black' };
        } else if (selectedPlan?.rct_ProgressID === 3) {
            return { backgroundColor: '#FFB6B6', color: 'black' }; // Red shade
        }

    };
    const itemTemplate = (option) => {

        let itemStyle = {};
        if (option.rct_ProgressID == 2) {
            itemStyle = { backgroundColor: '#FFF9BF', color: 'black' };
        } else if (option.rct_ProgressID === 1) {
            itemStyle = { backgroundColor: '#B6FFA1', color: 'black' };
        } else if (option.rct_ProgressID === 3) {
            itemStyle = { backgroundColor: '#FFB6B6', color: 'black' }; // Red shade
        }

        return (
            <div style={{ padding: '5px', ...itemStyle }}>
                {option.rct_Code}
            </div>
        );
    };
    const handleBulkAction = () => {
        setLoading(true);
        const id = selectedPlan.rct_ID;
        const data = {
            id: selectedPlan.rct_ID,
            value: 'true'
        }



        DashboardService.MarkReceiptBulk(data).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });

    };
    const handleSingleAction = () => {
        setLoading(true);
        const id = selectedPlan.rct_ID;

        const data = {
            id: selectedPlan.rct_ID,
            value: 'false'
        }




        DashboardService.MarkReceiptBulk(data).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });

    };


    const handleToggleChange = (e) => {
        setChecked(e.value);
        if (e.value) {
            handleBulkAction();
        } else {
            handleSingleAction();
        }
    };
    return (
        <>
            <DashboardMenu />
            <Helmet>
                <title>{titles.Dashboard}</title>
            </Helmet>
            <Dialog closable={false} header="Confirmation" visible={displayConfirmation1} onHide={() => setDisplayConfirmation1(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter1}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to remove this receipt plan?</span>
                </div>
            </Dialog>
            <Dialog closable={false} header="Confirmation" visible={displayConfirmationReset} onHide={() => setDisplayConfirmationReset(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooterReset}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to reset this receipt plan?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation} onHide={() => setDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Receipt plan already exists, do you want to regenerate receipt plan?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayDeleteConfirmation} onHide={() => setDisplayDeleteConfirmation(false)} style={{ width: '350px' }} modal footer={confirmationDeleteDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to delete?</span>
                </div>
            </Dialog>
            <Toast ref={toast} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    label="Refresh"
                    loading={loading}
                    onClick={Refresh}
                    severity="success"
                    icon="pi pi-refresh"
                    className="ml-4"
                    size='small'
                />
            </div>
            <div className="grid">

                <div className="col-12 lg:col-6 xl:col-8">

                    <Dropdown
                        value={selectedPlan}
                        options={receipt}
                        onChange={(e) => {
                            const id = e.value.rct_ID;
                            getReceivingPlans(e.value);
                        }}
                        optionLabel="rct_Code"
                        filter
                        placeholder="Select"
                        style={{ width: '300px', ...getDropdownStyle() }}
                        itemTemplate={itemTemplate}
                    />
                    {hasActionAccess(PAGE_KEY, "generate_receiving_plan") && (<Button label="Generate Receiving Plan" loading={loading} onClick={generatePlan} severity="primary" className='ml-4' />)}
                    {hasActionAccess(PAGE_KEY, "delete") && (<Button label="Delete" onClick={removeItemsPopup} severity="danger" className='ml-4' />)}
                    {hasActionAccess(PAGE_KEY, "regular_receiving") && (<ToggleButton onLabel="Bulk Receiving" offLabel="Regular Receiving" className='ml-4' checked={checked} onChange={handleToggleChange} />)}
                    {hasActionAccess(PAGE_KEY, "reset") && (<Button label="Reset" onClick={resetreceipt} severity="warning" className='ml-4' />)}
                </div>
                <div className="col-12 lg:col-6 xl:col-4 flex justify-content-end">
                    {/* <Button label="Complete" severity="success" className='px-6'/>   */}
                </div>


                <div className="col-12 xl:col-8">
                    <div className="custom-card">

                        <div className='flex justify-content-between flex-wrap'>
                            <h5 className=' pt-2'>Receiving Plan</h5>
                            <div>
                                {hasActionAccess(PAGE_KEY, "mark_as_arrived") && (
                                    <Button
                                        label={(containerMark == '') ? 'Mark As Arrived' : 'Mark As Completed'}
                                        size='small'
                                        icon="pi pi-check"
                                        severity={(containerMark == '') ? 'primary' : 'success'}
                                        className="custome-small-btn"
                                        onClick={() => markContainer()}
                                    />
                                )}
                            </div>




                        </div>
                        <DataTable value={receivingPlanData} size="small" stripedRows loading={loading} scrollable scrollHeight="470px" editMode="row" dataKey="ide" onRowEditComplete={onReceivingRowEditComplete}>
                            <Column header="Lane" field="lane" body={(data) => data.lane} />
                            <Column field="slot_id" editor={(options) => slotsDropDownEditor(options)} header="Slot" body={(data) => data.title} />
                            <Column field="upc" editor={(options) => textEditor(options)} header="Item Code"
                                body={itemCodeBodyTemplate}
                            />
                            <Column header="Total Iter" field='total_iteration' editor={(options) => textEditor(options)} body={(data) => data.total_iteration} />
                            <Column header="Lot No" field='lot_Number' editor={(options) => textEditor(options)} body={(data) => data.lot_Number} />
                            <Column field="qty_onslot" header="Slot Qty" body={(data) => data.qty_onslot !== null ? data.qty_onslot : 0} />
                            <Column field="qty_arrived" header="Arrived Qty" body={(data) => data.qty_arrived !== null ? data.qty_arrived : 0} />
                            <Column header="Qty" field='qty_pallet_to_cases' editor={(options) => textEditor(options)} body={(data) => data.qty_pallet_to_cases} />
                            <Column bodyStyle={{ textAlign: 'right' }} body={actionBodyTemplate} ></Column>
                            <Column rowEditor="true" bodyStyle={{ textAlign: 'left' }}></Column>
                        </DataTable>
                        <div className="footer-buttons flex justify-content-end flex-wrap">
                            {(selectedPlan != null) ?
                                <>
                                    {hasActionAccess(PAGE_KEY, "add_planned_item") && (<button className="add-button flex align-items-left justify-content-left" onClick={() => { getAllItemsFun(selectedPlan.rct_ID); setReceivingModel(true); setHeading(' Add Planned Item') }}>
                                        Add Planned Item +
                                    </button>)}
                                    {hasActionAccess(PAGE_KEY, "add_new_item") && (<button className="add-button flex align-items-left justify-content-left" onClick={() => { getAllItemsFun(); setReceivingModel(true); setHeading('Add New Item') }}>
                                        Add New Item +
                                    </button>)}
                                </>
                                : ''
                            }
                        </div>
                    </div>

                </div>
                <Dialog header={heading} visible={receivingModel} style={{ width: '30vw' }} position='top' onHide={() => { if (!receivingModel) return; cancleModel(); }}>
                    <p className="m-0">
                        <div className="flex flex-column px-8 py-5 gap-4" style={{ borderRadius: '12px', backgroundColor: '#f9f9f9' }}>
                            {(receivingMsg != '') ? (<p className="p-error font-semibold">{receivingMsg}</p>) : ''}
                            <form onSubmit={form.handleSubmit(onSubmit)} className="">

                                <div className="inline-flex flex-column  gap-2 pb-2" >
                                    <Controller
                                        name="slot"
                                        control={form.control}

                                        render={({ field, fieldState }) => (
                                            <>
                                                <label className="font-semibold">Slot*</label>
                                                {slotsDropDownEditor([])}
                                                {(slotmsg != '') ? (<small className="p-error">{slotmsg}</small>) : ''}
                                            </>
                                        )}
                                    />

                                </div>
                                <div className="inline-flex flex-column  gap-2 pb-2">

                                    <Controller
                                        name="upc"
                                        control={form.control}

                                        render={({ field, fieldState }) => (
                                            <>
                                                <label className="font-semibold">Item Code*</label>
                                                {itemsDropDownEditor([])}
                                                {(upcmsg != '') ? (<small className="p-error">{upcmsg}</small>) : ''}
                                            </>
                                        )}
                                    />
                                </div>
                                <div className="inline-flex flex-column  gap-2 pb-2">

                                    <Controller
                                        name="lot_Number"
                                        control={form.control}
                                        //    rules={{ 
                                        //     required: 'Lot no is required.'
                                        // }}

                                        render={({ field, fieldState }) => (
                                            <>
                                                <label className="font-semibold">Lot No</label>
                                                <InputText
                                                    id={field.name}
                                                    value={field.value}
                                                    type="text"
                                                    className={classNames({ 'p-invalid': fieldState.error })}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        field.onChange(value);
                                                    }}
                                                />
                                                {getFormErrorMessage(field.name)}
                                            </>
                                        )}
                                    />
                                </div>
                                <div className="inline-flex flex-column gap-2 ">

                                    <Controller
                                        name="qty"
                                        control={form.control}
                                        rules={{
                                            required: 'Quantity is required.'
                                        }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <label className="font-semibold">Qty*</label>
                                                <InputText id={field.name}
                                                    value={field.value}
                                                    type="number"
                                                    className={classNames({ 'p-invalid': fieldState.error })}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (value >= 0 || value === "") {
                                                            field.onChange(value);
                                                        }
                                                    }}
                                                />
                                                {getFormErrorMessage(field.name)}
                                            </>
                                        )}
                                    />
                                </div>
                                <div className="inline-flex flex-column gap-2 pb-5">

                                    <Controller
                                        name="iter"
                                        control={form.control}
                                        // rules={{ 
                                        //     required: 'Iteration is required.'
                                        // }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <label className="font-semibold">Iteration</label>
                                                <InputText id={field.name}
                                                    value={field.value}
                                                    type="number"
                                                    className={classNames({ 'p-invalid': fieldState.error })}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (value >= 0 || value === "") {
                                                            field.onChange(value);
                                                        }
                                                    }}
                                                />
                                                {getFormErrorMessage(field.name)}
                                            </>
                                        )}
                                    />
                                </div>
                                <div className="flex align-items-center gap-2">
                                    <Button label="Save" type='submit' className="p-3 w-full " loading={loading1} icon="pi pi-check" size="small" ></Button>
                                    <Button label="Cancel" type='button' onClick={() => cancleModel()} icon="pi pi-times" size="small" className="p-3 w-full "></Button>
                                </div>
                            </form>
                        </div>
                    </p>
                </Dialog>
                <div className="col-12 xl:col-4">
                    <div className="custom-card">
                        <div className='flex justify-content-between flex-wrap'>
                            <div><h5 className='pt-2'>User Lane</h5></div>
                            <div>
                                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                                <Button label="Setup" size='small' icon="pi pi-cog" className="custome-small-btn" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />
                            </div>




                        </div>

                        <DataTable value={usersLane} size="small" loading={userLaneLoading} scrollable scrollHeight="208px" editMode="row" dataKey="id" onRowEditComplete={onRowEditComplete}>
                            <Column field="Lane" header="Lane" style={{ width: '30%' }} body={(data) => data.lane} />
                            <Column field="User Name" header="User Name" style={{ width: '70%' }} body={userBodyTemplate} />
                        </DataTable>

                    </div>

                    <div className="custom-card">
                        <h5>Error Lane</h5>

                        <DataTable value={errorLaneStatus} size="small" scrollable scrollHeight="208px" dataKey="ide" >
                            <Column field="SKU" header="SKU" style={{ width: '80%' }} body={(data) => {
                                return (
                                    <div className="flex align-items-center gap-3">
                                        <img alt="flag" src={`assets/demo/images/product/chakra-bracelet.jpg`} style={{ width: '34px', height: '26px' }} />
                                        <div className='flex flex-column'>
                                            <div className='flex align-items-center justify-content-center text-sm'>{data.sku}</div>
                                            <div className='flex align-items-center justify-content-center text-xs'>{data.upc}</div>
                                        </div>
                                    </div>
                                );
                            }} />
                            <Column field="QTY" header="Qty" style={{ width: '20%' }} body={(data) => data.QTY} />

                        </DataTable>

                    </div>

                </div>

            </div>
            <div className="chart-container">
                {laneStatusChart.map((item, index) => (

                    <ChartComponent
                        key={index}
                        lane={item.lane}
                        progress={item.progress}
                        barData={item.barData}
                    />
                ))}
            </div>
        </>
    );
}

const comparisonFn = function (prevProps, nextProps) {
    return (prevProps.location.pathname === nextProps.location.pathname) && (prevProps.colorMode === nextProps.colorMode);
};

export default React.memo(Dashboard, comparisonFn);
