import { computed, nextTick, onBeforeUnmount, onMounted, ref, Ref, watch } from 'vue'

export const useCarouselAnimation = (props: {
  items: any[],
  autoscrollInterval: number,
  autoscrollPauseDuration: number,
  autoscroll: boolean,
  loop: boolean,
  infinite: boolean
}, currentSlide: Ref<number>) => {
  let animationInterval = -1
  let direction = 1

  const start = () => {
    if (!props.autoscroll) { return }

    animationInterval = setInterval(() => {
      if (props.loop) {
        currentSlide.value += 1
        if (currentSlide.value >= props.items.length) { currentSlide.value = 0 }
      } else {
        if (currentSlide.value <= 0) { direction = 1 }
        if (currentSlide.value >= props.items.length - 1) { direction = -1 }
        currentSlide.value += direction
      }
    }, props.autoscrollInterval) as any
  }

  let timeout: number
  const pause = () => {
    if (!props.autoscroll) { return }

    clearInterval(animationInterval)

    timeout = setTimeout(() => {
      start()
      clearTimeout(timeout)
    }, props.autoscrollPauseDuration) as any
  }

  const stop = () => {
    clearInterval(animationInterval)
  }

  onMounted(() => start())
  onBeforeUnmount(() => stop())

  const withPause = <T extends (...args: any[]) => any>(fn: T) => {
    return (...args: Parameters<T>) => {
      pause()
      fn(...args)
    }
  }

  const slidesContainerStyle = ref({
    transition: undefined as string | undefined,
  })

  /**
   * Used for infinite loop. In infinite loop additional first item is placed after all items.
   * Use own currentSlider, which will not update model value if we need to show slide that placed after all items
   */
  const sliderToBeShown = ref(0)

  watch(currentSlide, (newValue, oldValue) => {
    if (props.infinite) {
      if (newValue === 0 && oldValue === props.items.length - 1) {
        sliderToBeShown.value = props.items.length
        return
      }

      if (sliderToBeShown.value === props.items.length) {
        // If on last slide move to 0 without animation
        slidesContainerStyle.value.transition = 'none'
        sliderToBeShown.value = 0
        setTimeout(() => {
          // Then move to target slide with animation from 0
          sliderToBeShown.value = newValue
          slidesContainerStyle.value.transition = undefined
        })
        return
      }
    }

    sliderToBeShown.value = newValue
  })

  return {
    start,
    pause,
    stop,
    withPause,
    slidesContainerStyle,
    sliderToBeShown,
  }
}
