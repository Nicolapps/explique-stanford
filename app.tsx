// @ts-ignore
import axios from "axios"
import { useEffect, useCallback } from "react"
import { userConf, generalConf } from "./config"
import { User } from "./model"
import { useStore } from './states'
import BaseRoutes from "./components/BaseRoutes"
import { appurl, apiurl } from "./config/app"

const breadcrumbItems = generalConf.breadcrumbItems
const menuItems = generalConf.menuItems
const adminMenu = generalConf.adminMenu

function App() {

  const setUser = useStore(state => state.setUser)
  const admin = useStore(state => state.admin)
  const setAdmin = useStore(state => state.setAdmin)

  const isAdmin = useCallback((user: User) => {
    
    let result = false

    if (userConf.adminGroups.length === 0) {

      console.error("There is not admin groups set.")

    } else if (user.group) {

      result = userConf.adminGroups.map((group) => user.group.includes(group)).reduce((prev, curr) => prev || curr)

    }

    setAdmin(result)
    const elementExist = [...document.querySelectorAll('#nav-aside ul li a')].some(element => element.innerHTML === 'Admin')
    if (result && !elementExist) menuItems.push(adminMenu)

    return result

  }, [setAdmin])

  const getUser = useCallback(async (controller: AbortController) => {

    axios.get(`${apiurl}/auth/login`, { signal: controller.signal })
      .then((response) => {
        setUser(response.data.person)
        isAdmin(response.data.person)

      }).catch((err) => {
        if (err.message === 'canceled') {
        } else if (err.message === 'Network Error') {
          window.location.href = `${apiurl}/auth/login?next=https://${appurl}`
          console.log(window.location.href)
        } else {
          console.error(err.message)
        }
      })
  }, [isAdmin, setUser])

useEffect(() => {
  
    const controller = new AbortController()
    getUser(controller)
    return () => {
      controller.abort()
    } 

}, [getUser, setAdmin])

  return (
    <>
  )
}

export default App
