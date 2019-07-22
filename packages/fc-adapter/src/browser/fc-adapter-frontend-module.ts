import { ContainerModule } from 'inversify';
import { FCProxyCreator } from './fc-proxy-creator';
import { ProxyCreator } from '@webserverless/core/lib/browser';

export default new ContainerModule(bind => {
    bind(FCProxyCreator).toSelf().inSingletonScope();
    bind(ProxyCreator).toService(FCProxyCreator);
});
