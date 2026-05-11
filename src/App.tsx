import ruRU from 'antd/locale/ru_RU';
import { ConfigProvider } from 'antd';

function App() {
    return (
        <ConfigProvider
            locale={ruRU}
        >
            <div className="App"></div>
        </ConfigProvider>
    );
}

export default App;