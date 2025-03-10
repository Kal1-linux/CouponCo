import { Formik, Form, Field } from "formik";
import axios from "axios";
import { toast, Toaster } from 'react-hot-toast'
import { useLocation } from "react-router-dom";
import typesData from "../../api/AllTypes";
import { useState ,useEffect} from "react";
// import Events from '../../api/event';
import { format } from 'date-fns';
import { useNavigate } from "react-router-dom";

function AddCoupons() {
    const [Events,setEvents] = useState([]);
    const today = new Date();
    const formattedToday = format(today, 'yyyy-MM-dd');
    console.log(formattedToday);
    const navigate = useNavigate();
    const initialValues = {
        title: "",
        type: "",
        category: "",
        couponCode: "",
        dueDate: "",
        link: "",
        description: "",
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        border: '1px solid black',
        borderRadius: '0.375rem',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        outline: 'none',
    };

    const [selectedEvents, setSelectedEvents] = useState([]);

    const location = useLocation();

    const sId = location.state?.sId;

    useEffect(() => {
        const fetchData = () => {
            let config = {
                method: 'get',
                maxBodyLength: Infinity,
                url: `${import.meta.env.VITE_SERVER}/api/getAllEvents`,
                headers: {}
            };

            axios.request(config)
                .then((response) => {
                   setEvents(response.data.data)
                })
                .catch((error) => {
                    console.log(error);
                });

        }
        fetchData();
    }, [])


    const handleSubmit = (values) => {

        let data = JSON.stringify({
            "title": values.title,
            "type": values.type,
            "category": values.category,
            "couponCode": values.couponCode,
            "dueDate": values.dueDate,
            "isVerified": true,
            "ref_link": values.link,
            "description": values.description,
            ...(selectedEvents.length !== 0 && { "events": selectedEvents }),
        });


        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${import.meta.env.VITE_SERVER}/api/admin/addCoupons/${sId}`,
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${localStorage.getItem('token')}`
            },
            data: data
        };

        axios.request(config)
            .then((response) => {
                toast.success("Coupon Added successfully");
                console.log(response.data);
            })
            .catch((error) => {
                toast.error(error.response.data.message);
                console.error(error);
            });
    }

    return (
        <>
            <Toaster position="top-center"></Toaster>
            <div className="w-1/2 mx-auto p-4 bg-white rounded-lg">
                <h1 className="text-center mb-6 text-2xl font-bold">Add New Coupon</h1>
                <Formik initialValues={initialValues} onSubmit={handleSubmit}>
                    {({ values }) => (
                        <Form>
                            <div className="mb-4">
                                <label htmlFor="title" className="block mb-1 font-medium">
                                    title:
                                </label>
                                <Field
                                    type="text"
                                    id="title"
                                    name="title"
                                    style={inputStyle}
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="type" className="block mb-1 font-medium">
                                    Type:
                                </label>
                                <Field
                                    as="select"
                                    id="type"
                                    name="type"
                                    style={inputStyle}
                                >
                                    <option value="">Select Type</option>
                                    <option value="Codes">
                                        Codes
                                    </option>
                                    <option value="Deals">
                                        Deals
                                    </option>
                                </Field>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="category" className="block mb-1 font-medium">
                                    Category:
                                </label>
                                <Field
                                    as="select"
                                    id="category"
                                    name="category"
                                    style={inputStyle}
                                >
                                    <option value="">Select Category</option>
                                    {typesData.map((category, index) => (
                                        <option key={index} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </Field>
                            </div>
                            <div className="mb-4">
                                <label htmlFor="category" className="block mb-1 font-medium">
                                    Events:
                                </label>
                                <div className="grid grid-cols-3 justify-items-stretch gap-5 my-2">
                                    {
                                        Events.map((event, index) => <div key={index} className="inline-flex items-center gap-5">

                                            <input type="checkbox"
                                                className="bg-[#FAF9F5] w-6 h-6 outline-none border rounded-lg p-1 accent-[#FAF9F5]"
                                                checked={selectedEvents.includes(event.event_name)}
                                                onChange={(e) => {
                                                    const isChecked = e.target.checked;
                                                    setSelectedEvents((prevEvents) => {
                                                        if (isChecked) {
                                                            return [...prevEvents, event.event_name];
                                                        } else {
                                                            return prevEvents.filter((prevEvent) => prevEvent !== event.event_name);
                                                        }
                                                    });
                                                }}
                                            />

                                            <span className="text-md flex items-center gap-2">{event.event_name} </span>
                                        </div>)
                                    }
                                </div>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="couponCode" className="block mb-1 font-medium">
                                    couponCode:
                                </label>
                                <Field
                                    type="text"
                                    id="couponCode"
                                    name="couponCode"
                                    style={inputStyle}
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="dueDate" className="block mb-1 font-medium">
                                    dueDate:
                                </label>
                                <Field
                                    type="date"
                                    min={formattedToday}
                                    id="dueDate"
                                    name="dueDate"
                                    style={inputStyle}
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="link" className="block mb-1 font-medium">
                                    link:
                                </label>
                                <Field
                                    type="text"
                                    id="link"
                                    name="link"
                                    style={inputStyle}
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="description" className="block mb-1 font-medium">
                                    Description:
                                </label>
                                <Field
                                    type="text"
                                    id="description"
                                    name="description"
                                    style={inputStyle}
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring focus:ring-pink-200"
                                // onClick={() => navigate("/Admin/updateCoupons", { state: { cId: coupon.coupon_id, sId: coupon.store_id } })}
                            >
                                Submit
                            </button>
                        </Form>
                    )}
                </Formik>
            </div>
        </>
    );
}

export default AddCoupons;