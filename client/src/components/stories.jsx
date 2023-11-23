import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Stories = () => {

    const [featured, setFeatured] = useState([]);
    const [images, setImages] = useState([]);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const response = await axios.get('http://localhost:4000/api/storeDisplay');
                if (response.data && response.data.data) {
                    const filteredStores = response.data.data.filter(store => store.show_in_fetured === 1);
                    setFeatured(filteredStores);

                    const logoUrls = await Promise.all(filteredStores.map(async store => {
                        try {
                            const storeDetails = await axios.get(`http://localhost:4000/api/getStore/${store.store_id}`);
                            return storeDetails.data.store.logo_url || null;
                        } catch (error) {
                            console.error('Error fetching store logo:', error);
                            return null;
                        }
                    }));
                    setImages(logoUrls);
                }
            } catch (error) {
                console.error('Error fetching card stores:', error);
            }
        };

        fetchStores();
    }, []);

    const navigate = useNavigate();

    return (
        <div className="lg:mx-28 mx-5">
            <div className="flex flex-col justify-center lg:flex-row lg:justify-between mt-10">
                <div className="flex flex-col gap-1 lg:gap-5">
                    <span className="font-semibold text-lg lg:text-3xl">Top Featured Stores</span>
                </div>
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-8 lg:gap-5 my-5">
                {featured.map((ele, index) => (
                    <div key={index} className="flex flex-col gap-2 h-[10rem] lg:h-[20rem] cursor-pointer group items-center justify-center">
                        <div style={{ backgroundColor: `${ele.background}` }} className="h-[5rem] w-[5rem] lg:h-[10rem] lg:w-[10rem] p-5 rounded-full flex items-center justify-center border-2 border-black hover:shadow-2xl overflow-hidden">
                            <img src={images[index]} alt={`Logo ${index}`} onClick={() => {
                                navigate(
                                    '/Store', { state: { sId: ele.store_id } }
                                )
                            }} className="h-auto w-auto max-h-full max-w-full cursor-pointer" />
                        </div>
                        <div className="hover:underline text-center group-hover:underline">
                            <span className="flex justify-center gap-2 items-center ">
                                <span>{ele.coupons_count}</span>
                                <span>coupons</span>
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Stories;
