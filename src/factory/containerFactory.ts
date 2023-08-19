import {ContainerView} from "../ui/container/container.view";

export class ContainerFactory {

  // main window container
  private mainContainer: ContainerView;

  // popout window containers: hash -> ContainerView
  private popoutContainers: Map<string, ContainerView> = new Map<string, ContainerView>();


  public setMainContainer = (container: ContainerView): void => {
    this.mainContainer = container;
  }
  public getMainContainer = (): ContainerView => {
    return this.mainContainer;
  }

  public setPopoutContainer = (key: string, container: ContainerView): void => {
    this.popoutContainers.set(key, container);
  }
  public getPopoutContainer = (key: string): ContainerView => {
    return this.popoutContainers.get(key);
  }
  public getPopoutContainers = (): Map<string, ContainerView> => {
    return this.popoutContainers;
  }

  public getContainer = (targetEl: HTMLImageElement): ContainerView => {
    const bodyEl = targetEl?.matchParent('body');
    if (!bodyEl) return null;
    const oitEventKey = bodyEl.getAttribute('data-oit-event');
    if (oitEventKey) {
      //popout window
      return this.getPopoutContainer(oitEventKey);
    }
    return this.mainContainer;
  }

  public getAllContainers = (): ContainerView[] => {
    let allContainerViews = [this.mainContainer];
    for (let value of this.popoutContainers.values()) {
      allContainerViews.push(value);
    }
    return allContainerViews;
  }

  public clearAll = () => {
    this.mainContainer = null;
    this.popoutContainers.clear();
  }

}