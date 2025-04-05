import {IWorkerPlugin, ISession, task, step} from '@ijstech/plugin';
import Fetch from '@ijstech/fetch';

export default class Worker implements IWorkerPlugin {    
    @task()
    async process(session: ISession, data?: any): Promise<any> {
        let result = {
            step1: false,
            step2: 0
        }
        result.step1 = await this.step1();
        result.step2 = await this.step2();
        return result;
    };
    @step()
    async step1(): Promise<boolean>{
        let result = await Fetch.post('https://postman-echo.com/post', {
            body: {
                data: 'test'
            }
        });
        return result.status == 200;
    }
    @step({maxAttempts: 3})
    async step2():Promise<number>{
        let self = this as any;
        if (!self.retryCount){
            self.retryCount = 1;
            throw new Error('retry error');
        };
        self.retryCount++;
        return self.retryCount;
    }
};