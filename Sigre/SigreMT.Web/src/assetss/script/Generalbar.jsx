import { useEffect } from 'react';

const Generalbar = () => {
  useEffect(() => {
    const allDropdown = document.querySelectorAll('#sidebar .side-dropdown');
    const sidebar = document.getElementById('sidebar');
    
    if (allDropdown && sidebar) {
      allDropdown.forEach(item => {
        const a = item.parentElement.querySelector('a:first-child');
        if (a) {
          a.addEventListener('click', function (e) {
            e.preventDefault();

            if (!this.classList.contains('active')) {
              allDropdown.forEach(i => {
                const aLink = i.parentElement.querySelector('a:first-child');
                if (aLink) {
                  aLink.classList.remove('active');
                  i.classList.remove('show');
                }
              });
            }

            this.classList.toggle('active');
            item.classList.toggle('show');
          });
        }
      });
    }

    const toggleSidebar = document.querySelector('nav .toggle-sidebar');
    const allSideDivider = document.querySelectorAll('#sidebar .divider');

    if (sidebar && toggleSidebar) {
      if (sidebar.classList.contains('hide')) {
        allSideDivider.forEach(item => item.textContent = '-');
        allDropdown.forEach(item => {
          const a = item.parentElement.querySelector('a:first-child');
          if (a) {
            a.classList.remove('active');
            item.classList.remove('show');
          }
        });
      } else {
        allSideDivider.forEach(item => {
          item.textContent = item.dataset.text;
        });
      }

      toggleSidebar.addEventListener('click', function () {
        sidebar.classList.toggle('hide');

        if (sidebar.classList.contains('hide')) {
          allSideDivider.forEach(item => item.textContent = '-');
          allDropdown.forEach(item => {
            const a = item.parentElement.querySelector('a:first-child');
            if (a) {
              a.classList.remove('active');
              item.classList.remove('show');
            }
          });
        } else {
          allSideDivider.forEach(item => {
            item.textContent = item.dataset.text;
          });
        }
      });
    }

    const profile = document.querySelector('nav .profile');
    const imgProfile = profile ? profile.querySelector('img') : null;
    const dropdownProfile = profile ? profile.querySelector('.profile-link') : null;

    if (imgProfile && dropdownProfile) {
      imgProfile.addEventListener('click', function () {
        dropdownProfile.classList.toggle('show');
      });
    }

    const allMenu = document.querySelectorAll('main .content-data .head .menu');

    allMenu.forEach(item => {
      const icon = item.querySelector('.icon');
      const menuLink = item.querySelector('.menu-link');

      if (icon && menuLink) {
        icon.addEventListener('click', function () {
          menuLink.classList.toggle('show');
        });
      }
    });

    window.addEventListener('click', function (e) {
      if (e.target !== imgProfile) {
        if (e.target !== dropdownProfile) {
          if (dropdownProfile && dropdownProfile.classList.contains('show')) {
            dropdownProfile.classList.remove('show');
          }
        }
      }

      allMenu.forEach(item => {
        const icon = item.querySelector('.icon');
        const menuLink = item.querySelector('.menu-link');

        if (e.target !== icon && e.target !== menuLink && menuLink.classList.contains('show')) {
          menuLink.classList.remove('show');
        }
      });
    });

    const allProgress = document.querySelectorAll('main .card .progress');

    allProgress.forEach(item => {
      item.style.setProperty('--value', item.dataset.value);
    });
  }, []); // El array vacío [] asegura que el efecto solo se ejecute cuando el componente se monta
};

export default Generalbar;
