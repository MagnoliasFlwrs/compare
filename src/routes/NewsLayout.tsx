import React, {useEffect} from 'react';
import {useNewsStore} from "../stores/newsStore";
import {Flex} from "antd";

const NewsLayout = () => {

    const getNews= useNewsStore((state)=>state.getNews);

    useEffect(() => {
        getNews()
    }, []);

    return (
        <Flex vertical gap={16}>
            fjhvblhfb
        </Flex>
    );
};

export default NewsLayout;