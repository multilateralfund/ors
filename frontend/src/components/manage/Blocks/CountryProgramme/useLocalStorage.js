import storage from '@ors/storage'

export function useEditLocalStorage(report) {
  const key = `CP_RECOVERY_${report.country.iso3}_${report.data.year}_EDIT`

  function load() {
    if (report.data) {
      const data = storage.loadLocalStorage(key)
      if (data?.report_id === report.data.id) {
        return data.form
      } else {
        storage.clearLocalStorage(key)
      }
    }
  }

  function update(form) {
    const data = {
      form: form,
      report_id: report.data.id,
    }
    storage.updateLocalStorage(key, data)
  }

  return {
    load,
    update,
  }
}

export function useCreateLocalStorage(form) {
  const key = 'CP_RECOVERY_CREATE'

  function load() {
    return storage.loadLocalStorage(key)
  }

  function update(form) {
    storage.updateLocalStorage(key, form)
  }

  function clear() {
    storage.clearLocalStorage(key)
  }

  return {
    clear,
    load,
    update,
  }
}
