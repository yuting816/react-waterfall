import React, { useState,  useEffect, useRef, useImperativeHandle} from 'react';
import "./index.css";
import { data } from "../../data/index";



// 列子组件
const Column = React.forwardRef((props, ref) => {
    let { columns, index } = props

    return (
        <div
        className='col'
        ref={ref}
        > 
        {
            columns[index].list.map((innerItem, innerIndex)=>{
                return (
                    <div
                        style={{
                            width: '100%',
                            marginBottom: '20px',
                            position: 'relative',
                            cursor: 'pointer',
                            height: innerItem.height
                        }}
                        className={innerItem.height}
                        key={innerItem.url + innerIndex}
                        onClick={()=>{}}
                        > 
                            <img 
                            className='image' 
                            src={innerItem.url}
                            alt="image"/>
                            <div
                            className='imageHover'
                            onClick={()=>{ }}
                            >
                            </div>
                    </div> 
                )
            })
        }
        </div>
    )
})


/* 瀑布流组件：
由4列图片组成，按行依次在每列中插入图片，图片的高度从三个固定高度中随机分配，
遇到太长或者太短的高度则补充一个对应的高度 */

function Waterfall() {
    // 渲染的图片指标
    let [renderIndex, setRenderIndex] = useState(0);
    // 列
    let [columns, setColumns] = useState([
        { name: 'first-col', list: [] },
        { name: 'second-col', list: [] },
        { name: 'third-col', list: [] },
        { name: 'fourth-col', list: [] },
    ]);
    // 存放图片url的列表
    let [list, setList] = useState(null)
    // 滚动高度
    let [lastScrollTop, setLastScrollTop] = useState(-1)
    // 当前页数，页数大于2时停止滚动
    let [currentPage, setCurrentPage] = useState(0)
    // 是否停止滚动
    let [ifFinished, setIfFinished] = useState(false)
    // 计算列的高度
    let useColRefs = {
        'first-col': useRef(null),
        'second-col': useRef(null),
        'third-col': useRef(null),
        'fourth-col': useRef(null), 
    }

    useEffect(()=>{
        if (renderIndex == 0) {
            // 首次渲染的时候先请求数据
            async function fetchData () {
                let res = await loadData()
                let imageList = []
                res.forEach((item, index)=>{
                    imageList.push({
                        url: item
                    })
                })
                // 同步改变列表。。。这个用法不规范，但是不这么用就不对。。。有更好的方法吗？？
                list = imageList
                setList(imageList)
                renderWaterfall() 
            }
            fetchData()
        } else {
            renderWaterfall()
        }
    }, [renderIndex])

    const loadData = async () => {
        return Promise.resolve().then(()=>{
            return data
        })
    }

    // 图片随机高度
    const getRandomHeight = ()=>{
        const arr = ['short', 'middle', 'high']
        var rand = Math.floor(Math.random()*arr.length);
        const value = arr[rand]
        return value
    }

    // 滚动
    const scroll = () => {
        // document.documentElement 整个html文件
        const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
        // console.log(888, [scrollTop, clientHeight, scrollHeight]);

        // 超过最大距离则不滚动
        if (lastScrollTop >  Math.ceil(scrollTop)) return;
        
        // 连续滚动事件只触发一次，很重要！！！！！，不然会有重复滚动
        // Math.ceil的用法是适配不同屏幕，有的屏幕scrollTop是小数
        if(scrollHeight  - clientHeight == Math.ceil(scrollTop) ) {
            setLastScrollTop(Math.ceil(scrollTop))
            renderWaterfall()
        }
    }


    useEffect(()=>{
        // console.log('启用滚动');
        // 监听滚动事件
        // 第三个参数，事件冒泡还是捕获
        window.addEventListener('scroll', scroll, false);
        // scroll()
        // 关闭页面时取消事件监听
        return ()=>{
            window.removeEventListener('scroll', scroll, false );
        }
    }, [renderIndex])  

    // 找到最小高度列
    const miniHeight = () => {
        let arr = []

        for (let key in useColRefs) {
           arr.push(useColRefs[key].current.offsetHeight)
        }
       
        return Math.min.apply(null, arr)
    }

    // 找到最小高度列的Index
    const miniIndex = () => {
        const heightMin = miniHeight();
        
        let minColName
        for (let key in useColRefs) {
            if (useColRefs[key].current.offsetHeight == heightMin) {
                minColName = key
            }
        }
       
        let index =  columns.findIndex((item, index)=>{
            return item.name === minColName
        })
        
        return index
    }

    // 分配图片高度
    const dispatchHeight = (height) => {
        const image = list[renderIndex]
        
        if (image) {
            columns[miniIndex()].list.push({
                url: image.url,
                height: height,
            });
        }
    }
    
    // 渲染的方法，最重要！！！
    const renderWaterfall = async () => {
        // console.log('渲染图片', renderIndex, list.length);
        if (!list) return
        
        if (list && renderIndex > list.length - 1)  return
        
        //每页有63张图片，渲染完之后再请求一页数据，渲染3页之后到底
        // 如果当前已经渲染的个数加上一页的请求数量大于当前数组个数就发起请求。
        if (list && renderIndex === list.length - 1) {

            if (currentPage > 1) {
                setIfFinished(true)
                return
            }

            currentPage = currentPage + 1
            setCurrentPage(currentPage)

            let imageList = []
            let res = await loadData()
            res.forEach((item, index)=>{
                imageList.push({
                    url: item
                })
            })
            list = [...list, ...imageList]
            
            setList(list)    
        };

        
        const { scrollTop, clientHeight } = document.documentElement;
       
        // 与其之后弥补，不如之前就做一个约束
        // 判断
        if (renderIndex < 4) {
            // 每列渲染第一张图片的时候不能计算列元素的高度,随机分配高度
            let image = list[renderIndex]
            
            // 随机分配图片高度 
            let height = getRandomHeight()

            columns[renderIndex].list.push({
                url: image.url,
                height: height,
            })
           
        } else {
            // 滚动一次后什么时候停止渲染
            // 如果高度最小的列减去滚动的高度大于可视区的1.5倍返回
            if (miniHeight() - Math.ceil(scrollTop)  >= clientHeight * 1.5) {
                return;
            }

            // 每次都找到所有列高度最小的进行渲染
            const curretColList = columns[miniIndex()].list;
            const length = curretColList.length 
            // 过高, 连续三个高的之后补一个矮的
            if (curretColList[length - 1] === 'high' && curretColList[length - 2] === 'high' && curretColList[length - 3] === 'high') {
                dispatchHeight('short')
    
            } else if (curretColList[length - 1] === 'short' && curretColList[length - 2] === 'short' && curretColList[length - 3] === 'short') {
                dispatchHeight('high')
            } else {
                // 随机分配图片高度
                let height = getRandomHeight()
                dispatchHeight(height)
            }
        }

        setColumns(columns)
        // 又是同步更新...求更好的方法
        renderIndex = renderIndex + 1
        setRenderIndex(renderIndex)
    }

    return (
        <div className='waterfallContainer'>
            <div  className='waterFall'>
                {
                  columns[0].list.length > 0 &&  columns.map((item, index)=>{
                        return (
                            <Column 
                            ref={useColRefs[item.name]} 
                            columns={columns}
                            setColumns={setColumns}
                            index={index}
                            key={index}
                            >
                            </Column>
                        )
                    })
                }
            </div>
            {
                ifFinished && <div style={{
                    fontSize: 20,
                    textAlign: 'center'
                }}>到底啦~~</div>
            }
        </div>
    )
}

export default Waterfall